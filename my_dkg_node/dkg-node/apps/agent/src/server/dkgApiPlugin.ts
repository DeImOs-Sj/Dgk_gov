import { defineDkgPlugin } from "@dkg/plugins";

/**
 * DKG REST API Plugin
 * Provides REST API endpoints for DKG operations (create, get, query)
 */
export default defineDkgPlugin((ctx, mcp, api) => {
  // POST /api/dkg/assets - Create/Publish a knowledge asset
  api.post("/api/dkg/assets", async (req, res) => {
    try {
      const { content, metadata = {}, publishOptions = {} } = req.body;

      if (!content) {
        return res.status(400).json({
          success: false,
          error: "Missing required field: content",
        });
      }

      const privacy = publishOptions.privacy || "public";
      const epochsNum = publishOptions.epochs || 2;
      const priority = publishOptions.priority || 50;

      // Wrap content based on privacy setting
      const wrapped = { [privacy]: content };

      // Create the asset on DKG
      const createResult = await ctx.dkg.asset.create(wrapped, {
        epochsNum,
        minimumNumberOfFinalizationConfirmations: 3,
        minimumNumberOfNodeReplications: 1,
      });

      const ual = createResult?.UAL || null;

      if (!ual) {
        return res.status(500).json({
          success: false,
          error: "Failed to create asset - no UAL returned",
        });
      }

      return res.status(200).json({
        success: true,
        id: ual,
        ual: ual,
        status: "published",
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("DKG Asset Creation Error:", error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // GET /api/dkg/assets - Get an asset by UAL
  api.get("/api/dkg/assets", async (req, res) => {
    try {
      const { ual } = req.query;

      if (!ual || typeof ual !== "string") {
        return res.status(400).json({
          success: false,
          error: "Missing required query parameter: ual",
        });
      }

      const getResult = await ctx.dkg.asset.get(ual, {
        includeMetadata: true,
      });

      return res.status(200).json({
        success: true,
        data: getResult,
      });
    } catch (error) {
      console.error("DKG Asset Get Error:", error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // GET /api/dkg/assets/status/:assetId - Get asset publication status
  api.get("/api/dkg/assets/status/:assetId", async (req, res) => {
    try {
      const { assetId } = req.params;

      // Since dkg.js returns UAL immediately on creation, we consider it published
      // Try to get the asset to verify it exists
      const getResult = await ctx.dkg.asset.get(assetId, {
        includeMetadata: true,
      });

      return res.status(200).json({
        success: true,
        ual: assetId,
        status: "published",
        data: getResult,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        status: "not_found",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // GET /api/dkg/metrics/queue - Simple health check endpoint
  api.get("/api/dkg/metrics/queue", async (req, res) => {
    try {
      return res.status(200).json({
        success: true,
        queue: {
          pending: 0,
          processing: 0,
          completed: 0,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  console.log("✅ DKG REST API Plugin loaded");
  console.log("   - POST /api/dkg/assets");
  console.log("   - GET /api/dkg/assets?ual=...");
  console.log("   - GET /api/dkg/assets/status/:assetId");
  console.log("   - GET /api/dkg/metrics/queue");
});
