import { Database } from "../database";
import { assets, publishingAttempts, wallets } from "../database/schema";
import { eq, sql, and, gte, lte } from "drizzle-orm";

export interface PublishingMetrics {
  totalAssets: number;
  publishedAssets: number;
  failedAssets: number;
  pendingAssets: number;
  successRate: number;
  avgPublishTime: number;
  totalGasUsed: number;
}

export interface WalletMetrics {
  walletId: number;
  address: string;
  totalPublishes: number;
  successfulPublishes: number;
  failedPublishes: number;
  totalGasUsed: number;
  avgPublishTime: number;
}

export class MetricsService {
  constructor(private db: Database) {}

  /**
   * Get overall publishing metrics
   */
  async getPublishingMetrics(dateRange?: {
    from: Date;
    to: Date;
  }): Promise<PublishingMetrics> {
    let whereClause = undefined;

    if (dateRange) {
      whereClause = and(
        gte(assets.createdAt, dateRange.from),
        lte(assets.createdAt, dateRange.to),
      );
    }

    const metrics = await this.db
      .select({
        totalAssets: sql<number>`COUNT(*)`,
        publishedAssets: sql<number>`SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END)`,
        failedAssets: sql<number>`SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END)`,
        pendingAssets: sql<number>`SUM(CASE WHEN status IN ('pending', 'queued', 'assigned', 'publishing') THEN 1 ELSE 0 END)`,
      })
      .from(assets)
      .where(whereClause);

    const attemptMetrics = await this.db
      .select({
        avgPublishTime: sql<number>`AVG(duration_seconds)`,
        totalGasUsed: sql<number>`SUM(gas_used)`,
      })
      .from(publishingAttempts)
      .where(eq(publishingAttempts.status, "success"));

    const totalAssets = Number(metrics[0].totalAssets) || 0;
    const publishedAssets = Number(metrics[0].publishedAssets) || 0;

    return {
      totalAssets,
      publishedAssets,
      failedAssets: Number(metrics[0].failedAssets) || 0,
      pendingAssets: Number(metrics[0].pendingAssets) || 0,
      successRate: totalAssets > 0 ? (publishedAssets / totalAssets) * 100 : 0,
      avgPublishTime: Number(attemptMetrics[0].avgPublishTime) || 0,
      totalGasUsed: Number(attemptMetrics[0].totalGasUsed) || 0,
    };
  }

  /**
   * Get metrics by source
   */
  async getSourceMetrics(source: string): Promise<PublishingMetrics> {
    const metrics = await this.db
      .select({
        totalAssets: sql<number>`COUNT(*)`,
        publishedAssets: sql<number>`SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END)`,
        failedAssets: sql<number>`SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END)`,
        pendingAssets: sql<number>`SUM(CASE WHEN status IN ('pending', 'queued', 'assigned', 'publishing') THEN 1 ELSE 0 END)`,
      })
      .from(assets)
      .where(eq(assets.source, source));

    const totalAssets = Number(metrics[0].totalAssets) || 0;
    const publishedAssets = Number(metrics[0].publishedAssets) || 0;

    return {
      totalAssets,
      publishedAssets,
      failedAssets: Number(metrics[0].failedAssets) || 0,
      pendingAssets: Number(metrics[0].pendingAssets) || 0,
      successRate: totalAssets > 0 ? (publishedAssets / totalAssets) * 100 : 0,
      avgPublishTime: 0, // Would need to join with attempts to get this
      totalGasUsed: 0,
    };
  }

  /**
   * Get per-wallet metrics
   */
  async getWalletMetrics(): Promise<WalletMetrics[]> {
    const walletData = await this.db
      .select({
        walletId: wallets.id,
        address: wallets.address,
        totalUses: wallets.totalUses,
        successfulUses: wallets.successfulUses,
        failedUses: wallets.failedUses,
      })
      .from(wallets)
      .where(eq(wallets.isActive, true));

    const walletMetrics: WalletMetrics[] = [];

    for (const wallet of walletData) {
      const attemptStats = await this.db
        .select({
          totalGasUsed: sql<number>`SUM(gas_used)`,
          avgPublishTime: sql<number>`AVG(duration_seconds)`,
        })
        .from(publishingAttempts)
        .where(
          and(
            eq(publishingAttempts.walletId, wallet.walletId),
            eq(publishingAttempts.status, "success"),
          ),
        );

      walletMetrics.push({
        walletId: wallet.walletId,
        address: wallet.address,
        totalPublishes: wallet.totalUses || 0,
        successfulPublishes: wallet.successfulUses || 0,
        failedPublishes: wallet.failedUses || 0,
        totalGasUsed: Number(attemptStats[0]?.totalGasUsed) || 0,
        avgPublishTime: Number(attemptStats[0]?.avgPublishTime) || 0,
      });
    }

    return walletMetrics;
  }

  /**
   * Get hourly publishing stats
   */
  async getHourlyStats(hours: number = 24): Promise<any[]> {
    const result = await this.db.execute(sql`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00') as hour,
        COUNT(*) as total_assets,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM assets
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${hours} HOUR)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00')
      ORDER BY hour DESC
    `);

    return result as any[];
  }

  /**
   * Get gas usage trends
   */
  async getGasUsageTrends(days: number = 7): Promise<any[]> {
    const result = await this.db.execute(sql`
      SELECT 
        DATE(completed_at) as date,
        SUM(gas_used) as total_gas,
        AVG(gas_used) as avg_gas,
        COUNT(*) as transaction_count
      FROM publishing_attempts
      WHERE status = 'success' 
        AND completed_at >= DATE_SUB(NOW(), INTERVAL ${days} DAY)
      GROUP BY DATE(completed_at)
      ORDER BY date DESC
    `);

    return result as any[];
  }

  /**
   * Get error distribution
   */
  async getErrorDistribution(): Promise<any[]> {
    const result = await this.db.execute(sql`
      SELECT 
        error_type,
        COUNT(*) as count,
        MAX(completed_at) as last_occurrence
      FROM publishing_attempts
      WHERE status = 'failed'
        AND completed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY error_type
      ORDER BY count DESC
      LIMIT 10
    `);

    return result as any[];
  }

  /**
   * Get publishing performance by priority
   */
  async getPriorityMetrics(): Promise<any[]> {
    const result = await this.db.execute(sql`
      SELECT 
        priority,
        COUNT(*) as total,
        AVG(CASE 
          WHEN status = 'published' THEN 
            TIMESTAMPDIFF(SECOND, queued_at, published_at)
          ELSE NULL 
        END) as avg_time_to_publish,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as success_rate
      FROM assets
      WHERE queued_at IS NOT NULL
      GROUP BY priority
      ORDER BY priority DESC
    `);

    return result as any[];
  }
}
