import { defineDkgPlugin } from "@dkg/plugins";
import { openAPIRoute, z } from "@dkg/plugin-swagger";
import axios from "axios";
import { Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { withPaymentInterceptor } from "x402-axios";

export default defineDkgPlugin((ctx, mcp, api) => {
  // Get environment variables for x402 configuration
  const privateKey = process.env.X402_PRIVATE_KEY as Hex;
  const baseURL = process.env.X402_RESOURCE_SERVER_URL as string;
  const endpointPath = process.env.X402_ENDPOINT_PATH as string;

  // Only initialize x402 client if all required env vars are present
  let x402Client: ReturnType<typeof withPaymentInterceptor> | null = null;

  if (privateKey && baseURL) {
    try {
      // Create a wallet account to handle payments
      const account = privateKeyToAccount(privateKey);

      // Create an axios client with payment interceptor using x402-axios
      x402Client = withPaymentInterceptor(axios.create({ baseURL }), account);

      console.log("[x402] Payment client initialized successfully hello world");
    } catch (error) {
      console.error("[x402] Failed to initialize x402 client:", error);
    }
  } else {
    console.warn("[x402] Missing required environment variables (X402_PRIVATE_KEY, X402_RESOURCE_SERVER_URL). x402 tools will be disabled.");
  }

  // MCP Tool: Get data from x402-protected resource server
  mcp.registerTool(
    "x402-get-data",
    {
      title: "x402 Get Data from Resource Server",
      description: "Get data from an x402-protected resource server. Automatically handles payment via HTTP 402 responses.",
      inputSchema: {
        endpoint: z.string().optional().describe("Optional endpoint path. If not provided, uses X402_ENDPOINT_PATH from env vars."),
      },
    },
    async ({ endpoint }) => {
      if (!x402Client) {
        return {
          content: [{
            type: "text",
            text: "Error: x402 client not initialized. Please set X402_PRIVATE_KEY and X402_RESOURCE_SERVER_URL environment variables."
          }],
          isError: true,
        };
      }

      try {
        const path = endpoint || endpointPath;

        if (!path) {
          return {
            content: [{
              type: "text",
              text: "Error: No endpoint path provided. Either pass 'endpoint' parameter or set X402_ENDPOINT_PATH environment variable."
            }],
            isError: true,
          };
        }

        console.log(`[x402] Fetching data from x402 resource server: ${path}`);

        // Make request - x402-axios will automatically handle 402 payment responses
        const res = await x402Client.get(path);

        console.log(`[x402] Successfully fetched data from ${path}`);

        return {
          content: [{
            type: "text",
            text: JSON.stringify(res.data, null, 2)
          }],
        };
      } catch (error: unknown) {
        console.error("[x402] Error fetching data from x402 resource server:", error);

        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{
            type: "text",
            text: `Error: ${errorMessage || "Failed to fetch data from x402 resource server"}`
          }],
          isError: true,
        };
      }
    },
  );

  // API Route: Get data from x402-protected resource server
  api.get(
    "/x402/data",
    openAPIRoute(
      {
        tag: "x402",
        summary: "Get data from x402-protected resource server",
        description: "Fetch data from an x402-protected resource server with automatic payment handling",
        query: z.object({
          endpoint: z.string().optional().openapi({
            description: "Optional endpoint path. If not provided, uses X402_ENDPOINT_PATH from env vars.",
            example: "/weather",
          }),
        }),
        response: {
          description: "Data from the resource server",
          schema: z.object({
            success: z.boolean(),
            data: z.any().optional(),
            error: z.string().optional(),
          }),
        },
      },
      async (req, res) => {
        if (!x402Client) {
          return res.status(500).json({
            success: false,
            error: "x402 client not initialized. Please set X402_PRIVATE_KEY and X402_RESOURCE_SERVER_URL environment variables."
          });
        }

        try {
          const { endpoint } = req.query;
          const path = endpoint || endpointPath;

          if (!path) {
            return res.status(400).json({
              success: false,
              error: "No endpoint path provided. Either pass 'endpoint' query parameter or set X402_ENDPOINT_PATH environment variable."
            });
          }

          console.log(`[x402 API] Fetching data from x402 resource server: ${path}`);

          // Make request - x402-axios will automatically handle 402 payment responses
          const response = await x402Client.get(path);

          console.log(`[x402 API] Successfully fetched data from ${path}`);

          res.json({
            success: true,
            data: response.data
          });
        } catch (error: unknown) {
          console.error("[x402 API] Error fetching data from x402 resource server:", error);

          const errorMessage = error instanceof Error ? error.message : String(error);
          res.status(500).json({
            success: false,
            error: errorMessage || "Failed to fetch data from x402 resource server"
          });
        }
      },
    ),
  );

  // API Route: Check x402 plugin status
  api.get(
    "/x402/status",
    openAPIRoute(
      {
        tag: "x402",
        summary: "Check x402 plugin status",
        description: "Check if the x402 plugin is properly configured and initialized",
        response: {
          description: "x402 plugin status",
          schema: z.object({
            initialized: z.boolean(),
            hasPrivateKey: z.boolean(),
            hasBaseURL: z.boolean(),
            hasEndpointPath: z.boolean(),
            baseURL: z.string().optional(),
            endpointPath: z.string().optional(),
          }),
        },
      },
      (_req, res) => {
        res.json({
          initialized: x402Client !== null,
          hasPrivateKey: !!privateKey,
          hasBaseURL: !!baseURL,
          hasEndpointPath: !!endpointPath,
          baseURL: baseURL || undefined,
          endpointPath: endpointPath || undefined,
        });
      },
    ),
  );
});
