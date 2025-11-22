import { Request, Response, Router } from "express";
import { ServiceContainer } from "../services/ServiceContainer";
import { MetricsService } from "../services/MetricsService";
import { WalletService } from "../services/WalletService";
import { QueueService } from "../services/QueueService";
import { HealthMonitor } from "../services/HealthMonitor";

export class MetricsController {
  private metricsService: MetricsService;
  private walletService: WalletService;
  private queueService: QueueService;
  private healthMonitor: HealthMonitor;

  constructor(private container: ServiceContainer) {
    this.metricsService = container.get<MetricsService>("metricsService");
    this.walletService = container.get<WalletService>("walletService");
    this.queueService = container.get<QueueService>("queueService");
    this.healthMonitor = container.get<HealthMonitor>("healthMonitor");
  }

  /**
   * Register routes
   */
  registerRoutes(router: Router): void {
    // Queue metrics
    router.get("/api/knowledge/metrics/queue", this.getQueueStats.bind(this));

    // Wallet metrics
    router.get(
      "/api/knowledge/metrics/wallets",
      this.getWalletStats.bind(this),
    );

    // Publishing metrics
    router.get(
      "/api/knowledge/metrics/publishing",
      this.getPublishingMetrics.bind(this),
    );

    // Hourly stats
    router.get("/api/knowledge/metrics/hourly", this.getHourlyStats.bind(this));

    // Gas usage
    router.get("/api/knowledge/metrics/gas", this.getGasUsage.bind(this));

    // Error distribution
    router.get(
      "/api/knowledge/metrics/errors",
      this.getErrorDistribution.bind(this),
    );

    // Health check
    router.get("/api/knowledge/health", this.getHealthStatus.bind(this));
  }

  /**
   * GET /api/knowledge/metrics/queue
   * Get queue statistics
   */
  async getQueueStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.queueService.getQueueStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/knowledge/metrics/wallets
   * Get wallet pool statistics
   */
  async getWalletStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.walletService.getWalletStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/knowledge/metrics/publishing
   * Get overall publishing metrics
   */
  async getPublishingMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { from, to, source } = req.query;

      let dateRange;
      if (from && to) {
        dateRange = {
          from: new Date(from as string),
          to: new Date(to as string),
        };
      }

      let metrics;
      if (source) {
        metrics = await this.metricsService.getSourceMetrics(source as string);
      } else {
        metrics = await this.metricsService.getPublishingMetrics(dateRange);
      }

      res.json(metrics);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/knowledge/metrics/hourly
   * Get hourly publishing statistics
   */
  async getHourlyStats(req: Request, res: Response): Promise<void> {
    try {
      const hours = parseInt(req.query.hours as string) || 24;
      const stats = await this.metricsService.getHourlyStats(hours);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/knowledge/metrics/gas
   * Get gas usage trends
   */
  async getGasUsage(req: Request, res: Response): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const trends = await this.metricsService.getGasUsageTrends(days);
      res.json(trends);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/knowledge/metrics/errors
   * Get error distribution
   */
  async getErrorDistribution(req: Request, res: Response): Promise<void> {
    try {
      const errors = await this.metricsService.getErrorDistribution();
      res.json(errors);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/knowledge/health
   * Get system health status
   */
  async getHealthStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = await this.healthMonitor.getHealthStatus();
      const httpStatus = status.healthy ? 200 : 503;
      res.status(httpStatus).json(status);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
