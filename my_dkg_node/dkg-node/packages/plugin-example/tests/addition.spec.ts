/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it } from "mocha";
import { expect } from "chai";
import examplePlugin from "../dist/index.js";
import express from "express";
import request from "supertest";
import {
  createExpressApp,
  createInMemoryBlobStorage,
  createMcpServerClientPair,
  createMockDkgClient,
} from "@dkg/plugins/testing";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

// Mock DKG context
const mockDkgContext = {
  dkg: createMockDkgClient(),
  blob: createInMemoryBlobStorage(),
};

describe("@dkg/plugin-example checks", () => {
  let mockMcpServer: McpServer;
  let mockMcpClient: Client;
  let apiRouter: express.Router;
  let app: express.Application;

  beforeEach(async () => {
    const { server, client, connect } = await createMcpServerClientPair();
    mockMcpServer = server;
    mockMcpClient = client;
    apiRouter = express.Router();

    // Setup Express app
    app = createExpressApp();

    // Initialize plugin
    examplePlugin(mockDkgContext, mockMcpServer, apiRouter);
    await connect();

    // Mount the router
    app.use("/", apiRouter);
  });

  describe("MCP Tool Registration", () => {
    it("should register the add tool", async () => {
      const tools = await mockMcpClient.listTools().then((t) => t.tools);

      expect(tools.length).to.equal(1);
      expect(tools[0].name).to.equal("add");
    });

    it("should have correct tool configuration", async () => {
      const tools = await mockMcpClient.listTools().then((t) => t.tools);

      const addTool = tools.find((tool) => tool.name === "add");
      expect(addTool).to.not.equal(undefined);
      expect(addTool!.title).to.equal("Addition Tool");
      expect(addTool!.description).to.equal("Add two numbers");
      expect(addTool!.inputSchema).to.not.equal(undefined);
    });
  });

  describe("MCP Tool Functionality", () => {
    it("should correctly add positive numbers", async () => {
      const result = await mockMcpClient.callTool({
        name: "add",
        arguments: { a: 5, b: 3 },
      });

      expect(result.content).to.be.an("array");
      expect((result.content as any[])[0].text).to.equal("8");
    });

    it("should correctly add decimal numbers", async () => {
      const result = await mockMcpClient.callTool({
        name: "add",
        arguments: { a: 10.5, b: 2.3 },
      });

      expect((result.content as any[])[0].text).to.equal("12.8");
    });

    it("should correctly add negative numbers", async () => {
      const result = await mockMcpClient.callTool({
        name: "add",
        arguments: { a: -5, b: 8 },
      });

      expect((result.content as any[])[0].text).to.equal("3");
    });

    it("should correctly add zeros", async () => {
      const result = await mockMcpClient.callTool({
        name: "add",
        arguments: { a: 0, b: 0 },
      });

      expect((result.content as any[])[0].text).to.equal("0");
    });

    it("should include knowledge assets in response", async () => {
      const result = await mockMcpClient.callTool({
        name: "add",
        arguments: { a: 1, b: 1 },
      });

      expect(result.content).to.have.length.greaterThan(1);
      expect((result.content as any[])[1]).to.not.equal(undefined);
    });
  });

  describe("API Endpoint Functionality", () => {
    it("should respond to GET /add with correct result", async () => {
      const response = await request(app).get("/add?a=5&b=3").expect(200);

      expect(response.body.result).to.equal(8);
    });

    it("should handle decimal numbers", async () => {
      const response = await request(app).get("/add?a=10.5&b=2.3").expect(200);

      expect(response.body.result).to.equal(12.8);
    });

    it("should handle negative numbers", async () => {
      const response = await request(app).get("/add?a=-5&b=8").expect(200);

      expect(response.body.result).to.equal(3);
    });

    it("should handle zero values", async () => {
      const response = await request(app).get("/add?a=0&b=0").expect(200);

      expect(response.body.result).to.equal(0);
    });

    it("should return 400 for missing parameters", async () => {
      await request(app).get("/add").expect(400);
    });

    it("should return 400 for invalid parameters", async () => {
      await request(app).get("/add?a=invalid&b=3").expect(400);
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid tool parameters", async () => {
      try {
        await mockMcpClient.callTool({
          name: "add",
          arguments: {
            a: "invalid",
            b: "invalid",
          },
        });
        expect.fail("Should have thrown an error for invalid parameters");
      } catch (error) {
        expect(error).to.be.an("error");
      }
    });

    it("should handle missing tool parameters", async () => {
      try {
        await mockMcpClient.callTool({
          name: "add",
          arguments: { a: "5" },
        });
        expect.fail("Should have thrown an error for missing parameters");
      } catch (error) {
        expect(error).to.be.an("error");
      }
    });

    it("should handle malformed API requests", async () => {
      await request(app).get("/add?invalid=query").expect(400);
    });

    it("should handle non-numeric API parameters gracefully", async () => {
      await request(app).get("/add?a=text&b=moretext").expect(400);
    });
  });
});
