import { EventEmitter } from "events";
import { Database, assets, wallets, publishingAttempts} from "../database";
import { eq, sql, desc } from "drizzle-orm";
import { AssetService } from "./AssetService";
import { WalletService } from "./WalletService";
import type { QueueService } from "./QueueService";

export interface HealthStatus {
  healthy: boolean;
  checks: {
    database: boolean;
    redis: boolean;
    wallets: boolean;
    queue: boolean;
  };
  stats: {
    stuckAssets: number;
    stuckWallets: number;
    recentFailures: number;
  };
  warnings: string[];
}

export class HealthMonitor extends EventEmitter {
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private queueService?: QueueService;

  constructor(
    private db: Database,
    private assetService: AssetService,
    private walletService: WalletService,
  ) {
    super();
  }

   /**
   * Set QueueService reference (called after initialization to avoid circular dependency)
   */
  setQueueService(queueService: QueueService): void {
    this.queueService = queueService;
  }

  /**
   * Start health monitoring
   */
  start(intervalMs: number = 60000): void {
    if (this.isRunning) {
      console.log("Health monitor already running");
      return;
    }

    this.isRunning = true;
    console.log(
      `🏥 Health monitor started (checking every ${intervalMs / 1000} seconds)`,
    );

    // Stuck asset recovery is now handled by QueuePoller

    // Run initial check
    this.checkHealth();

    // Set up periodic checks
    this.healthCheckInterval = setInterval(async () => {
      await this.checkHealth();
    }, intervalMs);
  }

  // Stuck asset recovery moved to QueuePoller for centralized queue management

  /**
   * Stop health monitoring
   */
  stop(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    this.isRunning = false;

    // Cleanup all event listeners to prevent memory leaks
    this.removeAllListeners();

    console.log("🏥 Health monitor stopped");
  }

  /**
   * Perform health check
   */
  private async checkHealth(): Promise<void> {
    try {
      // Check for stuck assets
      await this.checkStuckAssets();

      // Check for stuck wallets
      await this.checkStuckWallets();

      // Check failure rates
      await this.checkFailureRates();

      // Emit health status
      this.emit("health-check-complete");
    } catch (error) {
      console.error("Health check failed:", error);
      this.emit("health-check-error", error);
    }
  }

  /**
   * Check for stuck assets and handle them
   */
  private async checkStuckAssets(): Promise<void> {
    // Check stuck "assigned" assets (>5 minutes)
    const stuckAssigned = await this.assetService.getStuckAssets("assigned", 5);

    for (const asset of stuckAssigned) {
      console.log(
        `⚠️ Asset ${asset.id} stuck in assigned status (assigned but never started publishing), resetting to queued...`,
      );

      // Reset to queued and release wallet atomically
      await this.db.transaction(async (tx) => {
        await tx
          .update(assets)
          .set({
            walletId: null,
            status: "queued",
            assignedAt: null,
            lastError:
              "Timeout: assigned to wallet but publishing never started within 5 minutes",
          })
          .where(eq(assets.id, asset.id));

        if (asset.walletId) {
          await tx
            .update(wallets)
            .set({
              isLocked: false,
              lockedAt: null,
            })
            .where(eq(wallets.id, asset.walletId));
        }
      });
    }

    // Check stuck "publishing" assets (>15 minutes) - increased timeout for long operations
    const stuckPublishing = await this.assetService.getStuckAssets(
      "publishing",
      15,
    );

    for (const asset of stuckPublishing) {
      console.log(
        `⚠️ Asset ${asset.id} stuck in publishing status (publishing for over 15 minutes), handling failure...`,
      );

      // 1. Find the latest publishing attempt and mark it as failed
      const latestAttempt = await this.db
        .select()
        .from(publishingAttempts)
        .where(eq(publishingAttempts.assetId, asset.id))
        .orderBy(desc(publishingAttempts.attemptNumber))
        .limit(1);

      if (latestAttempt.length > 0) {
        const attemptId = latestAttempt[0].id;
        await this.db
          .update(publishingAttempts)
          .set({
            status: "failed",
            errorType: "Timeout",
            errorMessage: "Publishing exceeded 15 minute timeout",
            durationSeconds: 900, // 15 minutes
          })
          .where(eq(publishingAttempts.id, attemptId));

        console.log(`   ✓ Marked publishing attempt ${attemptId} as failed`);
      }

      // 2. Remove the stuck job from Redis if QueueService is available
      if (this.queueService) {
        try {
          const jobId = `asset-${asset.id}`;
          const job = await this.queueService['publishQueue'].getJob(jobId);
          if (job) {
            await job.remove();
            console.log(`   ✓ Removed stuck Redis job ${jobId}`);
          }
        } catch (error) {
          console.error(`   ✗ Failed to remove Redis job for asset ${asset.id}:`, error);
        }
      }

      // 3. Handle asset failure with retry logic (increments retryCount)
      await this.assetService.handleAssetFailure(
        asset.id,
        "Timeout: publishing over 15 minutes"
      );

      // 4. Release wallet lock
      if (asset.walletId) {
        await this.db
          .update(wallets)
          .set({
            isLocked: false,
            lockedAt: null,
          })
          .where(eq(wallets.id, asset.walletId));

        console.log(`   ✓ Released wallet ${asset.walletId}`);
      }

      console.log(`   ✓ Asset ${asset.id} handled (will retry if under maxAttempts)`);
    }

    if (stuckAssigned.length > 0 || stuckPublishing.length > 0) {
      this.emit("stuck-assets-found", {
        assigned: stuckAssigned.length,
        publishing: stuckPublishing.length,
      });
    }
  }

  /**
   * Check for stuck wallets and release them
   */
  private async checkStuckWallets(): Promise<void> {
    const releasedCount = await this.walletService.unlockStuckWallets();

    if (releasedCount > 0) {
      console.log(`🔓 Released ${releasedCount} stuck wallet(s)`);
      this.emit("stuck-wallets-released", releasedCount);
    }
  }

  /**
   * Check recent failure rates
   */
  private async checkFailureRates(): Promise<void> {
    const recentAttempts = await this.db.execute(sql`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failures
      FROM publishing_attempts
      WHERE started_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `);

    const stats = recentAttempts[0] as any;
    const total = Number(stats[0]?.total) || 0;
    const failures = Number(stats[0]?.failures) || 0;

    if (total > 10 && failures / total > 0.5) {
      console.warn(
        `⚠️ High failure rate detected: ${failures}/${total} (${((failures / total) * 100).toFixed(1)}%)`,
      );
      this.emit("high-failure-rate", { total, failures });
    }
  }

  /**
   * Get current health status
   */
  async getHealthStatus(): Promise<HealthStatus> {
    const warnings: string[] = [];

    // Check database connection
    let databaseHealthy = true;
    try {
      await this.db.execute(sql`SELECT 1`);
    } catch {
      databaseHealthy = false;
      warnings.push("Database connection failed");
    }

    // Get stats
    const walletStats = await this.walletService.getWalletStats();
    const stuckAssigned = await this.assetService.getStuckAssets("assigned", 5);
    const stuckPublishing = await this.assetService.getStuckAssets(
      "publishing",
      15,
    );

    // Check wallet availability
    if (walletStats.available === 0 && walletStats.total > 0) {
      warnings.push("No wallets available");
    }

    // Check for stuck assets
    const totalStuck = stuckAssigned.length + stuckPublishing.length;
    if (totalStuck > 0) {
      warnings.push(`${totalStuck} assets stuck`);
    }

    // Get recent failures
    const recentFailures = await this.db.execute(sql`
      SELECT COUNT(*) as count
      FROM publishing_attempts
      WHERE status = 'failed' 
        AND completed_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `);

    const failureCount = Number((recentFailures[0] as any)[0]?.count) || 0;
    if (failureCount > 10) {
      warnings.push(`${failureCount} failures in last hour`);
    }

    return {
      healthy: warnings.length === 0,
      checks: {
        database: databaseHealthy,
        redis: true, // Would need redis reference to check
        wallets: walletStats.available > 0,
        queue: true, // Would need queue service reference to check
      },
      stats: {
        stuckAssets: totalStuck,
        stuckWallets:
          walletStats.total - walletStats.available - walletStats.inUse,
        recentFailures: failureCount,
      },
      warnings,
    };
  }
}
