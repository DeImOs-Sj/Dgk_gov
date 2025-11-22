import { Request, Response, Router } from "express";
import { ServiceContainer } from "../services/ServiceContainer";
import { QueueService } from "../services/QueueService";

export class AdminController {
  private queueService: QueueService;

  constructor(private container: ServiceContainer) {
    this.queueService = container.get<QueueService>("queueService");
  }

  /**
   * Register routes
   */
  registerRoutes(router: Router): void {
    // Bull Board Dashboard
    router.use("/admin/queues", this.queueService.getDashboard());

    // Queue control endpoints
    router.post("/api/admin/queue/pause", this.pauseQueue.bind(this));
    router.post("/api/admin/queue/resume", this.resumeQueue.bind(this));
    router.post(
      "/api/admin/queue/clear-completed",
      this.clearCompleted.bind(this),
    );
    router.post("/api/admin/queue/clear-failed", this.clearFailed.bind(this));
    router.post(
      "/api/admin/queue/retry-failed",
      this.retryAllFailed.bind(this),
    );
  }

  /**
   * POST /api/admin/queue/pause
   * Pause queue processing
   */
  async pauseQueue(req: Request, res: Response): Promise<void> {
    try {
      await this.queueService.pauseQueue();
      res.json({ message: "Queue paused successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/admin/queue/resume
   * Resume queue processing
   */
  async resumeQueue(req: Request, res: Response): Promise<void> {
    try {
      await this.queueService.resumeQueue();
      res.json({ message: "Queue resumed successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/admin/queue/clear-completed
   * Clear all completed jobs
   */
  async clearCompleted(req: Request, res: Response): Promise<void> {
    try {
      await this.queueService.clearCompleted();
      res.json({ message: "Completed jobs cleared" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/admin/queue/clear-failed
   * Clear all failed jobs
   */
  async clearFailed(req: Request, res: Response): Promise<void> {
    try {
      await this.queueService.clearFailed();
      res.json({ message: "Failed jobs cleared" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/admin/queue/retry-failed
   * Retry all failed jobs
   */
  async retryAllFailed(req: Request, res: Response): Promise<void> {
    try {
      const count = await this.queueService.retryFailed();
      res.json({
        message: `Retried ${count} failed jobs`,
        count,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
