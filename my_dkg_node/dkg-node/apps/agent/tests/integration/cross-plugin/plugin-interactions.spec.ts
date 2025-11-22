import { expect } from "chai";
import request from "supertest";
import { startTestServer } from "../setup/test-server";
import { TEST_FILES } from "../setup/test-data";
import {
  callMcpTool,
  initializeMcpSession,
  uploadTestFile,
} from "../setup/test-helpers";

/**
 * Cross-plugin integration tests
 * Tests how different plugins interact with each other in real scenarios
 */
describe("Cross-Plugin Integration", () => {
  let testServer: Awaited<ReturnType<typeof startTestServer>>;
  let accessToken: string;

  beforeEach(async function () {
    this.timeout(15000);
    testServer = await startTestServer();

    // Create access token with all scopes for cross-plugin testing
    accessToken = "test-cross-plugin-token";
    await testServer.testDatabase.oauthStorage.saveToken(accessToken, {
      token: accessToken,
      clientId: testServer.testDatabase.testClient.client_id,
      scopes: ["mcp", "blob", "scope123"],
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
      extra: { type: "access" },
    });
  });

  afterEach(async () => {
    if (testServer?.cleanup) {
      await testServer.cleanup();
    }
  });

  describe("OAuth + Blob Storage Integration", () => {
    it("should properly protect blob endpoints with OAuth scopes", async () => {
      // First, verify access works with proper token
      const uploadResponse = await request(testServer.app)
        .post("/blob")
        .set("Authorization", `Bearer ${accessToken}`)
        .field("filename", "protected-test.txt")
        .attach("file", Buffer.from("Protected content"), "protected-test.txt")
        .expect(201);

      const blobId = uploadResponse.body.id;
      expect(blobId).to.exist;

      // Verify retrieval works with proper token
      await request(testServer.app)
        .get(`/blob/${blobId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      // Create token without blob scope
      const limitedToken = "test-limited-cross-plugin";
      await testServer.testDatabase.oauthStorage.saveToken(limitedToken, {
        token: limitedToken,
        clientId: testServer.testDatabase.testClient.client_id,
        scopes: ["mcp"], // No blob scope
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
        extra: { type: "access" },
      });

      // Verify limited token cannot access blob endpoints
      await request(testServer.app)
        .post("/blob")
        .set("Authorization", `Bearer ${limitedToken}`)
        .field("filename", "should-fail.txt")
        .attach("file", Buffer.from("Should fail"), "should-fail.txt")
        .expect(403);

      await request(testServer.app)
        .get(`/blob/${blobId}`)
        .set("Authorization", `Bearer ${limitedToken}`)
        .expect(403);
    });
  });

  describe("Blob Storage + DKG Tools Integration", () => {
    it("should create DKG assets referencing blob storage", async () => {
      // Upload a file to blob storage
      const uploadResponse = await request(testServer.app)
        .post("/blob")
        .set("Authorization", `Bearer ${accessToken}`)
        .field("filename", "integration-test.json")
        .attach("file", TEST_FILES.jsonData.content, "integration-test.json")
        .expect(201);

      const blobId = uploadResponse.body.id;

      // Initialize MCP session
      const sessionId = await initializeMcpSession(
        testServer.app,
        accessToken,
        { name: "cross-plugin-test", version: "1.0.0" },
      );

      // Create DKG asset that references the blob
      const assetData = {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        name: "Cross-Plugin Integration Test Asset",
        description: "Asset created through cross-plugin integration",
        hasPart: [
          {
            "@type": "DataDownload",
            contentUrl: `dkg-blob://${blobId}`,
            encodingFormat: "application/json",
            name: "integration-test.json",
          },
        ],
      };

      const createResponse = await request(testServer.app)
        .post("/mcp")
        .set("Authorization", `Bearer ${accessToken}`)
        .set("Accept", "application/json, text/event-stream")
        .set("Content-Type", "application/json")
        .set("mcp-session-id", sessionId)
        .send({
          jsonrpc: "2.0",
          id: 2,
          method: "tools/call",
          params: {
            name: "dkg-create",
            arguments: {
              jsonld: JSON.stringify(assetData),
              privacy: "private",
            },
          },
        });

      expect(createResponse.status).to.equal(200);

      // Parse SSE response
      const sseLines = createResponse.text.split("\n");
      const dataLine = sseLines.find((line) => line.startsWith("data: "));
      if (!dataLine) throw new Error("No data line found in SSE response");
      const responseData = JSON.parse(dataLine.substring(6));

      expect(responseData.result.content[0].text).to.include(
        "successfully created",
      );

      // Verify blob is still accessible after DKG asset creation
      await request(testServer.app)
        .get(`/blob/${blobId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);
    });
  });

  describe("Plugin Namespacing", () => {
    it("should properly isolate plugin namespaces", async () => {
      // Test that plugins with different namespaces don't interfere

      // Access protected namespace endpoint (requires scope123)
      const protectedResponse = await request(testServer.app)
        .get("/protected/add?a=10&b=5")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(protectedResponse.body.result).to.equal(15);

      // Try with token that doesn't have scope123
      const noScopeToken = "test-no-scope123";
      await testServer.testDatabase.oauthStorage.saveToken(noScopeToken, {
        token: noScopeToken,
        clientId: testServer.testDatabase.testClient.client_id,
        scopes: ["mcp", "blob"], // No scope123
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
        extra: { type: "access" },
      });

      await request(testServer.app)
        .get("/protected/add?a=10&b=5")
        .set("Authorization", `Bearer ${noScopeToken}`)
        .expect(403);
    });
  });

  describe("MCP + OAuth Integration", () => {
    it("should protect MCP endpoints with OAuth authentication", async () => {
      // Try MCP without authentication
      await request(testServer.app)
        .post("/mcp")
        .set("Content-Type", "application/json")
        .send({
          jsonrpc: "2.0",
          id: 1,
          method: "tools/list",
        })
        .expect(401);

      // Initialize MCP session with authentication
      const initResponse = await request(testServer.app)
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
            clientInfo: { name: "mcp-oauth-test", version: "1.0.0" },
          },
        });

      expect(initResponse.status).to.equal(200);
      const sessionId = initResponse.headers["mcp-session-id"];
      if (!sessionId) throw new Error("Session ID is required");

      // List tools with authentication
      const toolsResponse = await request(testServer.app)
        .post("/mcp")
        .set("Authorization", `Bearer ${accessToken}`)
        .set("Accept", "application/json, text/event-stream")
        .set("Content-Type", "application/json")
        .set("mcp-session-id", sessionId)
        .send({
          jsonrpc: "2.0",
          id: 2,
          method: "tools/list",
        });

      expect(toolsResponse.status).to.equal(200);

      // Parse SSE response
      const sseLines = toolsResponse.text.split("\n");
      const dataLine = sseLines.find((line) => line.startsWith("data: "));
      if (!dataLine)
        throw new Error("No data line found in tools SSE response");
      const responseData = JSON.parse(dataLine.substring(6));

      expect(responseData.result.tools).to.be.an("array");
      expect(responseData.result.tools.length).to.be.greaterThan(0);
    });
  });
});
