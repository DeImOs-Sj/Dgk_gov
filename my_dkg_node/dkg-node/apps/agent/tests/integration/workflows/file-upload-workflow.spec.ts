import { expect } from "chai";
import request from "supertest";
import { startTestServer } from "../setup/test-server";
import {
  TEST_FILES,
  TEST_KNOWLEDGE_ASSETS,
  ASSERTIONS,
} from "../setup/test-data";
import { TEST_USERS } from "../setup/test-database";
import {
  callMcpTool,
  initializeMcpSession,
  uploadTestFile,
  createDkgAssetWithBlob,
} from "../setup/test-helpers";

/**
 * Integration test for complete file upload workflows
 * Tests the full flow: File Upload → Blob Storage → DKG Asset Creation
 */
describe("File Upload Workflow Integration", () => {
  let testServer: Awaited<ReturnType<typeof startTestServer>>;
  let accessToken: string;

  beforeEach(async function () {
    this.timeout(15000);
    testServer = await startTestServer();

    // Create access token directly in storage (bypassing OAuth flow issues)
    accessToken = "test-access-token-file-upload";
    await testServer.testDatabase.oauthStorage.saveToken(accessToken, {
      token: accessToken,
      clientId: testServer.testDatabase.testClient.client_id,
      scopes: ["mcp", "blob"],
      expiresAt: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      extra: { type: "access" },
    });
  });

  afterEach(async () => {
    if (testServer?.cleanup) {
      await testServer.cleanup();
    }
  });

  describe("Complete Upload to DKG Workflow", () => {
    it("should upload file, store in blob storage, and create DKG asset", async function () {
      this.timeout(30000);

      // Step 1: Upload file to blob storage
      const uploadResponse = await request(testServer.app)
        .post("/blob")
        .set("Authorization", `Bearer ${accessToken}`)
        .field("filename", TEST_FILES.jsonData.filename)
        .attach(
          "file",
          TEST_FILES.jsonData.content,
          TEST_FILES.jsonData.filename,
        )
        .expect(201); // Blob creation returns 201 Created

      expect(uploadResponse.body).to.have.property("id");
      expect(ASSERTIONS.validBlobId(uploadResponse.body.id)).to.be.true;
      const blobId = uploadResponse.body.id;

      // Step 2: Verify file can be retrieved from blob storage
      const retrieveResponse = await request(testServer.app)
        .get(`/blob/${blobId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(retrieveResponse.headers["content-type"]).to.include(
        "application/json",
      );
      const retrievedData = JSON.parse(retrieveResponse.text);
      expect(retrievedData).to.deep.equal(
        JSON.parse(TEST_FILES.jsonData.content.toString()),
      );

      // Step 3: Verify blob metadata from upload response
      expect(uploadResponse.body).to.have.property(
        "name",
        TEST_FILES.jsonData.filename,
      );
      expect(uploadResponse.body).to.have.property(
        "mimeType",
        TEST_FILES.jsonData.mimeType,
      );

      // Step 4: Create DKG asset using MCP tools that references the uploaded file
      const assetData = {
        ...TEST_KNOWLEDGE_ASSETS.withAttachments,
        hasPart: [
          {
            "@type": "DataDownload",
            contentUrl: `dkg-blob://${blobId}`,
            encodingFormat: TEST_FILES.jsonData.mimeType,
            name: TEST_FILES.jsonData.filename,
          },
        ],
      };

      // Initialize MCP session first
      const sessionId = await initializeMcpSession(testServer.app, accessToken);

      // Now call the dkg-create tool with the session ID
      const responseData = await callMcpTool(
        testServer.app,
        accessToken,
        sessionId,
        "dkg-create",
        {
          jsonld: JSON.stringify(assetData),
          privacy: "private",
        },
        2,
      );

      expect(responseData).to.have.property("result");
      expect(responseData.result).to.have.property("content");

      // The response should contain the UAL and success message
      const responseText = responseData.result.content[0].text;
      expect(responseText).to.include(
        "Knowledge Asset collection successfully created",
      );
      expect(responseText).to.include("UAL:");

      // Step 5: In mock environment, UAL might be null - just verify the success message
      const ualMatch = responseText.match(/UAL: (did:dkg:[^\s]+|null)/);
      expect(ualMatch).to.not.be.null;
      const ual = ualMatch![1];

      // In integration tests with mock DKG, we expect null UAL
      if (ual !== "null") {
        expect(ASSERTIONS.validUAL(ual)).to.be.true;
      }

      // Skip asset retrieval in mock environment with null UAL
      if (ual !== "null") {
        // Retrieve the created asset
        const getAssetResponse = await request(testServer.app)
          .post("/mcp")
          .set("Authorization", `Bearer ${accessToken}`)
          .set("Accept", "application/json, text/event-stream")
          .set("Content-Type", "application/json")
          .set("mcp-session-id", sessionId)
          .send({
            jsonrpc: "2.0",
            id: 3,
            method: "tools/call",
            params: {
              name: "dkg-get",
              arguments: {
                ual: ual,
              },
            },
          });

        const getAssetData = await callMcpTool(
          testServer.app,
          accessToken,
          sessionId,
          "dkg-get",
          { ual: ual },
          3,
        );

        const retrievedAsset = JSON.parse(getAssetData.result.content[0].text);
        expect(retrievedAsset).to.have.property("public");
        expect(retrievedAsset.public).to.have.property("hasPart");
        expect(retrievedAsset.public.hasPart[0]).to.have.property(
          "contentUrl",
          `dkg-blob://${blobId}`,
        );
      }
    });

    it("should handle multiple file uploads in a single asset", async function () {
      this.timeout(45000);

      const uploadedBlobIds: string[] = [];

      // Upload multiple files
      for (const [key, fileData] of Object.entries(TEST_FILES)) {
        const response = await request(testServer.app)
          .post("/blob")
          .set("Authorization", `Bearer ${accessToken}`)
          .field("filename", fileData.filename)
          .attach("file", fileData.content, fileData.filename)
          .expect(201); // Blob creation returns 201 Created

        uploadedBlobIds.push(response.body.id);
      }

      expect(uploadedBlobIds).to.have.length(4);

      // Create asset referencing all files
      const assetData = {
        ...TEST_KNOWLEDGE_ASSETS.complexDataset,
        name: "Multi-file Research Dataset",
        hasPart: uploadedBlobIds.map((blobId, index) => {
          const fileData = Object.values(TEST_FILES)[index];
          return {
            "@type": "DataDownload",
            contentUrl: `dkg-blob://${blobId}`,
            encodingFormat: fileData?.mimeType || "application/octet-stream",
            name: fileData?.filename || `file-${index}`,
          };
        }),
      };

      // Initialize MCP session
      const sessionId = await initializeMcpSession(testServer.app, accessToken);

      const createResponse = await request(testServer.app)
        .post("/mcp")
        .set("Authorization", `Bearer ${accessToken}`)
        .set("Accept", "application/json, text/event-stream")
        .set("Content-Type", "application/json")
        .set("mcp-session-id", sessionId)
        .send({
          jsonrpc: "2.0",
          id: 6,
          method: "tools/call",
          params: {
            name: "dkg-create",
            arguments: {
              jsonld: JSON.stringify(assetData),
              privacy: "public",
            },
          },
        });

      expect(createResponse.status).to.equal(200);

      // Parse SSE response for MCP call
      const createSseLines = createResponse.text.split("\n");
      const createDataLine = createSseLines.find((line) =>
        line.startsWith("data: "),
      );
      if (!createDataLine)
        throw new Error("No data line found in create SSE response");
      const createResponseData = JSON.parse(createDataLine.substring(6));

      const responseText = createResponseData.result.content[0].text;
      expect(responseText).to.include("successfully created");

      // Extract and verify UAL (will be null in mock environment)
      const ualMatch = responseText.match(/UAL: (did:dkg:[^\s]+|null)/);
      expect(ualMatch).to.not.be.null;
      const ual = ualMatch![1];

      // Skip asset retrieval in mock environment since UAL will be null
      if (ual !== "null") {
        // Initialize session for asset retrieval
        const getInitResponse = await request(testServer.app)
          .post("/mcp")
          .set("Authorization", `Bearer ${accessToken}`)
          .set("Accept", "application/json, text/event-stream")
          .set("Content-Type", "application/json")
          .send({
            jsonrpc: "2.0",
            id: 10,
            method: "initialize",
            params: {
              protocolVersion: "2024-11-05",
              capabilities: {},
              clientInfo: { name: "integration-test", version: "1.0.0" },
            },
          });

        expect(getInitResponse.status).to.equal(200);
        const getSessionId = getInitResponse.headers["mcp-session-id"];
        if (!getSessionId) throw new Error("Get session ID is required");

        // Retrieve and verify the asset has all file references
        const getResponse = await request(testServer.app)
          .post("/mcp")
          .set("Authorization", `Bearer ${accessToken}`)
          .set("Accept", "application/json, text/event-stream")
          .set("Content-Type", "application/json")
          .set("mcp-session-id", getSessionId)
          .send({
            jsonrpc: "2.0",
            id: 11,
            method: "tools/call",
            params: {
              name: "dkg-get",
              arguments: { ual },
            },
          });

        expect(getResponse.status).to.equal(200);

        // Parse SSE response
        const getSseLines = getResponse.text.split("\n");
        const getDataLine = getSseLines.find((line) =>
          line.startsWith("data: "),
        );
        if (!getDataLine)
          throw new Error("No data line found in get SSE response");
        const getResponseData = JSON.parse(getDataLine.substring(6));

        const retrievedAsset = JSON.parse(
          getResponseData.result.content[0].text,
        );
        expect(retrievedAsset.public.hasPart).to.have.length(4);
      }
    });

    it("should handle blob deletion workflow", async function () {
      this.timeout(15000);

      // Step 1: Upload a file to blob storage
      const uploadResponse = await request(testServer.app)
        .post("/blob")
        .set("Authorization", `Bearer ${accessToken}`)
        .field("filename", "delete-test.txt")
        .attach("file", Buffer.from("Content to be deleted"), "delete-test.txt")
        .expect(201);

      const blobId = uploadResponse.body.id;
      expect(blobId).to.exist;

      // Step 2: Verify file exists and can be retrieved
      await request(testServer.app)
        .get(`/blob/${blobId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      // Step 3: Delete the blob
      await request(testServer.app)
        .delete(`/blob/${blobId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      // Step 4: Verify file is no longer accessible
      await request(testServer.app)
        .get(`/blob/${blobId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(404);
    });

    it("should handle unauthorized blob deletion", async function () {
      this.timeout(15000);

      // Step 1: Upload a file
      const uploadResponse = await request(testServer.app)
        .post("/blob")
        .set("Authorization", `Bearer ${accessToken}`)
        .field("filename", "protected-delete-test.txt")
        .attach(
          "file",
          Buffer.from("Protected content"),
          "protected-delete-test.txt",
        )
        .expect(201);

      const blobId = uploadResponse.body.id;

      // Step 2: Try to delete without authorization
      await request(testServer.app).delete(`/blob/${blobId}`).expect(401);

      // Step 3: Try to delete with insufficient scope
      const limitedToken = "test-limited-delete-token";
      await testServer.testDatabase.oauthStorage.saveToken(limitedToken, {
        token: limitedToken,
        clientId: testServer.testDatabase.testClient.client_id,
        scopes: ["mcp"], // No blob scope
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
        extra: { type: "access" },
      });

      await request(testServer.app)
        .delete(`/blob/${blobId}`)
        .set("Authorization", `Bearer ${limitedToken}`)
        .expect(403);

      // Step 4: Verify file still exists (deletion was blocked)
      await request(testServer.app)
        .get(`/blob/${blobId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);
    });

    it("should handle deletion of nonexistent blob", async function () {
      // Try to delete a blob that doesn't exist - should be idempotent (return 200)
      await request(testServer.app)
        .delete("/blob/nonexistent-blob-id")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);
    });
  });

  describe("File Upload Error Scenarios", () => {
    it("should handle blob upload failure gracefully", async () => {
      // Try to upload without authorization
      await request(testServer.app)
        .post("/blob")
        .field("filename", "test.txt")
        .attach("file", Buffer.from("test"), "test.txt")
        .expect(401);

      // Try to upload with insufficient scope (create limited token directly - proven pattern)
      const limitedAccessToken = "test-limited-upload-token";
      await testServer.testDatabase.oauthStorage.saveToken(limitedAccessToken, {
        token: limitedAccessToken,
        clientId: testServer.testDatabase.testClient.client_id,
        scopes: ["mcp"], // No blob scope
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
        extra: { type: "access" },
      });

      await request(testServer.app)
        .post("/blob")
        .set("Authorization", `Bearer ${limitedAccessToken}`)
        .field("filename", "test.txt")
        .attach("file", Buffer.from("test"), "test.txt")
        .expect(403); // Should be forbidden due to missing blob scope
    });

    it("should handle DKG creation failure after successful upload", async () => {
      // Upload file successfully
      const uploadResponse = await request(testServer.app)
        .post("/blob")
        .set("Authorization", `Bearer ${accessToken}`)
        .field("filename", "test.txt")
        .attach("file", Buffer.from("test content"), "test.txt")
        .expect(201); // Blob creation returns 201 Created

      const blobId = uploadResponse.body.id;

      // Initialize MCP session for DKG creation
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
            clientInfo: { name: "integration-test", version: "1.0.0" },
          },
        });

      expect(initResponse.status).to.equal(200);
      const sessionId = initResponse.headers["mcp-session-id"];
      if (!sessionId) throw new Error("Session ID is required");

      // Try to create asset with invalid JSON-LD (should fail gracefully)
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
              jsonld: '{"this": "is invalid json without closing brace"',
              privacy: "private",
            },
          },
        });

      // Should handle the error gracefully (parse SSE response)
      expect(createResponse.status).to.equal(200);
      const sseLines = createResponse.text.split("\n");
      const dataLine = sseLines.find((line) => line.startsWith("data: "));
      if (!dataLine)
        throw new Error("No data line found in error SSE response");
      const responseData = JSON.parse(dataLine.substring(6));

      // Check if it's an error response format (could be result.isError or direct error)
      const hasError =
        responseData.error ||
        (responseData.result && responseData.result.isError) ||
        (responseData.result &&
          responseData.result.content &&
          responseData.result.content.some(
            (c: any) => c.text?.includes("Error") || c.text?.includes("Failed"),
          ));
      expect(hasError).to.be.true; // Should contain error due to invalid JSON-LD

      // Verify blob still exists and can be accessed
      await request(testServer.app)
        .get(`/blob/${blobId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200); // GET requests return 200 OK
    });
  });

  describe("MCP Resource Integration", () => {
    it("should allow MCP resources to reference blob storage", async () => {
      // Upload a file
      const uploadResponse = await request(testServer.app)
        .post("/blob")
        .set("Authorization", `Bearer ${accessToken}`)
        .field("filename", "resource-test.txt")
        .attach(
          "file",
          Buffer.from("MCP resource test content"),
          "resource-test.txt",
        )
        .expect(201); // Blob creation returns 201 Created

      const blobId = uploadResponse.body.id;

      // Initialize MCP session for resource access
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
            clientInfo: { name: "integration-test", version: "1.0.0" },
          },
        });

      expect(initResponse.status).to.equal(200);
      const sessionId = initResponse.headers["mcp-session-id"];
      if (!sessionId) throw new Error("Session ID is required");

      // Access blob via MCP resource endpoint
      const resourceResponse = await request(testServer.app)
        .post("/mcp")
        .set("Authorization", `Bearer ${accessToken}`)
        .set("Accept", "application/json, text/event-stream")
        .set("Content-Type", "application/json")
        .set("mcp-session-id", sessionId)
        .send({
          jsonrpc: "2.0",
          id: 2,
          method: "resources/read",
          params: {
            uri: `dkg-blob://${blobId}`,
          },
        })
        .expect(200);

      // Parse SSE response for MCP resource access
      const sseLines = resourceResponse.text.split("\n");
      const dataLine = sseLines.find((line) => line.startsWith("data: "));
      if (!dataLine)
        throw new Error("No data line found in resource SSE response");
      const responseData = JSON.parse(dataLine.substring(6));

      expect(responseData.result).to.have.property("contents");
      expect(responseData.result.contents[0]).to.have.property(
        "uri",
        `dkg-blob://${blobId}`,
      );
      expect(responseData.result.contents[0]).to.have.property("text");
    });
  });

  describe("Plugin Namespace Integration", () => {
    it("should properly handle namespaced plugin access", async function () {
      this.timeout(10000);

      // Get token with scope123 for protected namespace (create directly - proven pattern)
      const adminToken = "test-namespace-admin-token";
      await testServer.testDatabase.oauthStorage.saveToken(adminToken, {
        token: adminToken,
        clientId: testServer.testDatabase.testClient.client_id,
        scopes: ["mcp", "scope123"],
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
        extra: { type: "access" },
      });

      // Should be able to access protected namespace endpoint
      const protectedResponse = await request(testServer.app)
        .get("/protected/add?a=5&b=3")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(protectedResponse.body).to.have.property("result", 8);

      // User without scope123 should be denied
      await request(testServer.app)
        .get("/protected/add?a=5&b=3")
        .set("Authorization", `Bearer ${accessToken}`) // This token doesn't have scope123
        .expect(403);
    });
  });
});
