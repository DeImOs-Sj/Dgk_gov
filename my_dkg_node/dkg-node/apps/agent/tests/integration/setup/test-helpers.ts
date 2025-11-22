/**
 * Utility functions and helpers for integration tests
 * Reduces code duplication and improves test maintainability
 */

import request from "supertest";
import type { Express } from "express";

export interface TestAuthToken {
  token: string;
  scopes: string[];
  expiresAt: number;
}

export interface McpSession {
  sessionId: string;
  accessToken: string;
}

/**
 * Creates a test access token with specified scopes
 */
export async function createTestToken(
  testServer: any,
  scopes: string[] = ["mcp", "blob"],
  tokenSuffix: string = "default",
): Promise<string> {
  const token = `test-token-${tokenSuffix}-${Date.now()}`;

  await testServer.testDatabase.oauthStorage.saveToken(token, {
    token,
    clientId: testServer.testDatabase.testClient.client_id,
    scopes,
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
    extra: { type: "access" },
  });

  return token;
}

/**
 * Initializes an MCP session for testing
 */
export async function initializeMcpSession(
  app: Express,
  accessToken: string,
  clientInfo = { name: "integration-test", version: "1.0.0" },
): Promise<string> {
  const initResponse = await request(app)
    .post("/mcp")
    .set("Authorization", `Bearer ${accessToken}`)
    .set("Accept", "application/json, text/event-stream")
    .set("Content-Type", "application/json")
    .send({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo,
      },
    });

  if (initResponse.status !== 200) {
    throw new Error(
      `MCP initialization failed: ${initResponse.status} ${initResponse.text}`,
    );
  }

  const sessionId = initResponse.headers["mcp-session-id"];
  if (!sessionId) {
    throw new Error("No session ID returned from MCP initialization");
  }

  return sessionId;
}

/**
 * Calls an MCP tool with proper session handling
 */
export async function callMcpTool(
  app: Express,
  accessToken: string,
  sessionId: string,
  toolName: string,
  arguments_: Record<string, any> = {},
  id: number = 2,
): Promise<any> {
  const response = await request(app)
    .post("/mcp")
    .set("Authorization", `Bearer ${accessToken}`)
    .set("Accept", "application/json, text/event-stream")
    .set("Content-Type", "application/json")
    .set("mcp-session-id", sessionId)
    .send({
      jsonrpc: "2.0",
      id,
      method: "tools/call",
      params: {
        name: toolName,
        arguments: arguments_,
      },
    });

  if (response.status !== 200) {
    throw new Error(
      `MCP tool call failed: ${response.status} ${response.text}`,
    );
  }

  // Parse SSE response
  const sseLines = response.text.split("\n");
  const dataLine = sseLines.find((line) => line.startsWith("data: "));

  if (!dataLine) {
    throw new Error("No data line found in SSE response");
  }

  return JSON.parse(dataLine.substring(6));
}

/**
 * Lists MCP tools
 */
export async function listMcpTools(
  app: Express,
  accessToken: string,
  sessionId: string,
): Promise<any[]> {
  const response = await request(app)
    .post("/mcp")
    .set("Authorization", `Bearer ${accessToken}`)
    .set("Accept", "application/json, text/event-stream")
    .set("Content-Type", "application/json")
    .set("mcp-session-id", sessionId)
    .send({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list",
    });

  if (response.status !== 200) {
    throw new Error(
      `MCP tools list failed: ${response.status} ${response.text}`,
    );
  }

  // Parse SSE response
  const sseLines = response.text.split("\n");
  const dataLine = sseLines.find((line) => line.startsWith("data: "));

  if (!dataLine) {
    throw new Error("No data line found in SSE response");
  }

  const responseData = JSON.parse(dataLine.substring(6));
  return responseData.result.tools;
}

/**
 * Uploads a file to blob storage
 */
export async function uploadTestFile(
  app: Express,
  accessToken: string,
  content: Buffer | string,
  filename: string,
  mimeType: string = "text/plain",
): Promise<{ blobId: string; response: any }> {
  const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);

  const response = await request(app)
    .post("/blob")
    .set("Authorization", `Bearer ${accessToken}`)
    .field("filename", filename)
    .attach("file", buffer, filename);

  if (response.status !== 201) {
    throw new Error(`File upload failed: ${response.status} ${response.text}`);
  }

  return {
    blobId: response.body.id,
    response,
  };
}

/**
 * Retrieves a file from blob storage
 */
export async function retrieveTestFile(
  app: Express,
  accessToken: string,
  blobId: string,
): Promise<{ content: Buffer; response: any }> {
  const response = await request(app)
    .get(`/blob/${blobId}`)
    .set("Authorization", `Bearer ${accessToken}`);

  if (response.status !== 200) {
    throw new Error(
      `File retrieval failed: ${response.status} ${response.text}`,
    );
  }

  return {
    content: response.body,
    response,
  };
}

/**
 * Creates a complete DKG asset through the workflow
 */
export async function createDkgAssetWithBlob(
  app: Express,
  accessToken: string,
  fileContent: Buffer | string,
  filename: string,
  assetMetadata: Record<string, any>,
): Promise<{ blobId: string; assetResponse: any }> {
  // Upload file
  const { blobId } = await uploadTestFile(
    app,
    accessToken,
    fileContent,
    filename,
  );

  // Initialize MCP session
  const sessionId = await initializeMcpSession(app, accessToken);

  // Create asset referencing the blob
  const assetData = {
    ...assetMetadata,
    hasPart: [
      {
        "@type": "DataDownload",
        contentUrl: `dkg-blob://${blobId}`,
        encodingFormat: "application/json",
        name: filename,
      },
    ],
  };

  const assetResponse = await callMcpTool(
    app,
    accessToken,
    sessionId,
    "dkg-create",
    {
      jsonld: JSON.stringify(assetData),
      privacy: "private",
    },
  );

  return { blobId, assetResponse };
}

/**
 * Measures the execution time of an async operation
 */
export async function measureExecutionTime<T>(
  operation: () => Promise<T>,
): Promise<{ result: T; duration: number }> {
  const startTime = Date.now();
  const result = await operation();
  const endTime = Date.now();

  return {
    result,
    duration: endTime - startTime,
  };
}

/**
 * Waits for a condition to be true with timeout
 */
export async function waitFor(
  condition: () => Promise<boolean> | boolean,
  timeoutMs: number = 5000,
  intervalMs: number = 100,
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(`Condition not met within ${timeoutMs}ms`);
}

/**
 * Generates test data with various sizes and types
 */
export const TEST_DATA_GENERATORS = {
  text: (size: number) => Buffer.from("A".repeat(size)),
  json: (objectCount: number) =>
    Buffer.from(
      JSON.stringify({
        items: Array.from({ length: objectCount }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          value: Math.random(),
        })),
      }),
    ),
  csv: (rows: number) =>
    Buffer.from(
      Array.from(
        { length: rows },
        (_, i) => `${i},value_${i},${Math.random()}`,
      ).join("\n"),
    ),
  binary: (size: number) => Buffer.alloc(size, Math.floor(Math.random() * 256)),
};

/**
 * Validates common response patterns
 */
export const RESPONSE_VALIDATORS = {
  blobId: (id: string) => {
    return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}_.*/.test(
      id,
    );
  },

  mcpResponse: (response: any) => {
    return response.result && typeof response.result === "object";
  },

  oauthError: (response: any) => {
    return response.error && typeof response.error === "string";
  },
};

/**
 * Common test assertions
 */
export const ASSERTIONS = {
  isValidBlobId: (id: string) => {
    if (!RESPONSE_VALIDATORS.blobId(id)) {
      throw new Error(`Invalid blob ID format: ${id}`);
    }
  },

  hasRequiredProperties: (obj: any, properties: string[]) => {
    const missing = properties.filter((prop) => !(prop in obj));
    if (missing.length > 0) {
      throw new Error(`Missing required properties: ${missing.join(", ")}`);
    }
  },

  isWithinRange: (value: number, min: number, max: number, label?: string) => {
    if (value < min || value > max) {
      throw new Error(
        `${label || "Value"} ${value} not within range [${min}, ${max}]`,
      );
    }
  },
};
