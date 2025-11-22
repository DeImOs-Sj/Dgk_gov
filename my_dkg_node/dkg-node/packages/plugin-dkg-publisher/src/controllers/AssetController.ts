import { Request, Response, Router } from "express";
import { z } from "zod";
import { ServiceContainer } from "../services/ServiceContainer";
import { AssetService } from "../services/AssetService";
import { QueueService } from "../services/QueueService";
import { AssetInput } from "../types";

// Request validation schemas
const registerAssetSchema = z.object({
  content: z.union([z.object({}).passthrough(), z.string()]),
  metadata: z
    .object({
      source: z.string().optional(),
      sourceId: z.string().optional(),
    })
    .passthrough()
    .optional(),
  publishOptions: z
    .object({
      privacy: z.enum(["private", "public"]).optional(),
      priority: z.number().min(1).max(100).optional(),
      epochs: z.number().optional(),
      maxAttempts: z.number().optional(),
    })
    .optional(),
});

export class AssetController {
  private assetService: AssetService;
  private queueService: QueueService;

  constructor(private container: ServiceContainer) {
    this.assetService = container.get<AssetService>("assetService");
    this.queueService = container.get<QueueService>("queueService");
  }

  /**
   * Register routes
   */
  registerRoutes(router: Router): void {
    router.post("/api/knowledge/assets", this.registerAsset.bind(this));
    router.get("/api/knowledge/assets/:id", this.getAssetStatus.bind(this));
    router.get("/api/knowledge/assets", this.getAssetsBySource.bind(this));
    router.post(
      "/api/knowledge/assets/retry",
      this.retryFailedAssets.bind(this),
    );
  }

  /**
   * POST /api/knowledge/assets
   * Register and queue a new asset for publishing to DKG
   */
  async registerAsset(req: Request, res: Response): Promise<void> {
    try {
      console.log("🔄 Processing asset registration request...");

      // Validate request body
      const input = registerAssetSchema.parse(req.body);
      console.log("✅ Request validation passed");

      // Register asset in the system
      console.log("🔄 Registering asset in system...");
      const result = await this.assetService.registerAsset(input as AssetInput);
      console.log("✅ Asset registered with ID:", result.id);
      res.json(result);
      
    } catch (error: any) {
      console.error("❌ Asset registration failed:", error);

      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation error",
          details: error.errors,
        });
      } else {
        res.status(500).json({
          error: error.message,
          stack: error.stack,
        });
      }
    }
  }

  /**
   * GET /api/knowledge/assets/:id
   * Get asset publishing status by ID
   */
  async getAssetStatus(req: Request, res: Response): Promise<void> {
    try {
      const assetId = parseInt(req.params.id);

      if (isNaN(assetId)) {
        res.status(400).json({ error: "Invalid asset ID" });
        return;
      }

      const asset = await this.assetService.getAsset(assetId);

      if (!asset) {
        res.status(404).json({ error: "Asset not found" });
        return;
      }

      res.json(asset);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/knowledge/assets
   * Get assets by source with optional filters
   */
  async getAssetsBySource(req: Request, res: Response): Promise<void> {
    try {
      const { source, status, limit, offset } = req.query;

      if (!source) {
        res.status(400).json({ error: "Source parameter is required" });
        return;
      }

      const assets = await this.assetService.getAssetsBySource(
        source as string,
        {
          status: status as string,
          limit: limit ? parseInt(limit as string) : undefined,
          offset: offset ? parseInt(offset as string) : undefined,
        },
      );

      res.json(assets);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/knowledge/assets/retry
   * Retry failed assets for publishing
   */
  async retryFailedAssets(req: Request, res: Response): Promise<void> {
    try {
      const { source, maxAttempts } = req.body;

      const retryCount = await this.assetService.retryFailedAssets({
        source,
        maxAttempts,
      });

      res.json({
        message: `Queued ${retryCount} failed assets for retry`,
        count: retryCount,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
