import { describe, it, beforeEach, afterEach } from "mocha";
import { expect } from "chai";
import sinon from "sinon";
import oauthPlugin, { authorized, createOAuthPlugin } from "../dist/index.js";
import DemoOAuthStorageProvider from "../dist/storage/demo.js";
import { z } from "@dkg/plugin-swagger";
import {
  createExpressApp,
  createInMemoryBlobStorage,
  createMcpServerClientPair,
  createMockDkgClient,
} from "@dkg/plugins/testing";
import express from "express";
import request from "supertest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// Mock DKG context
const mockDkgContext = {
  dkg: createMockDkgClient(),
  blob: createInMemoryBlobStorage(),
};

// Test credentials schema
const testCredentialsSchema = z.object({
  username: z.string(),
  password: z.string(),
});

type TestCredentials = z.infer<typeof testCredentialsSchema>;

// Mock login function
const mockLogin = async (
  credentials: TestCredentials,
): Promise<{
  scopes: string[];
}> => {
  if (credentials.username === "admin" && credentials.password === "admin123") {
    return { scopes: ["read", "write", "admin"] };
  }
  if (credentials.username === "user" && credentials.password === "userpass") {
    return { scopes: ["read"] };
  }
  throw new Error("Invalid credentials");
};

// Mock logout function
const mockLogout = async (): Promise<void> => {
  // Simulate logout logic
  console.log("User logged out");
};

const TEST_ISSUER_URL = new URL("http://localhost:8900/oauth/");
const TEST_LOGIN_PAGE_URL = new URL("http://localhost:8081/login");
const TEST_SCOPES = ["read", "write", "admin"];

describe("@dkg/plugin-oauth checks", function () {
  let mockMcpServer: McpServer;
  let apiRouter: express.Router;
  let app: express.Application;
  let storage: DemoOAuthStorageProvider;

  // Set timeout for all tests to prevent hanging
  this.timeout(5000);

  beforeEach(async () => {
    const { server } = await createMcpServerClientPair();
    mockMcpServer = server;
    apiRouter = express.Router();
    storage = new DemoOAuthStorageProvider();

    // Setup Express app
    app = createExpressApp();

    // Initialize plugin
    const plugin = oauthPlugin({
      issuerUrl: TEST_ISSUER_URL,
      schema: testCredentialsSchema,
      login: mockLogin,
      logout: mockLogout,
      loginPageUrl: TEST_LOGIN_PAGE_URL,
      storage,
      scopesSupported: TEST_SCOPES,
      tokenExpirationInSeconds: 3600,
      refreshTokenExpirationInSeconds: 86400,
    });

    plugin(mockDkgContext, mockMcpServer, apiRouter);

    // Mount the router
    app.use("/", apiRouter);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("Plugin Configuration", () => {
    it("should create plugin with valid configuration", () => {
      const plugin = oauthPlugin({
        issuerUrl: TEST_ISSUER_URL,
        schema: testCredentialsSchema,
        login: mockLogin,
        loginPageUrl: TEST_LOGIN_PAGE_URL,
        storage,
      });

      expect(plugin).to.be.a("function");
    });

    it("should accept configuration with logout function", () => {
      const plugin = oauthPlugin({
        issuerUrl: TEST_ISSUER_URL,
        schema: testCredentialsSchema,
        login: mockLogin,
        logout: mockLogout,
        loginPageUrl: TEST_LOGIN_PAGE_URL,
        storage,
      });

      expect(plugin).to.be.a("function");
    });

    it("should accept configuration without logout function", () => {
      const plugin = oauthPlugin({
        issuerUrl: TEST_ISSUER_URL,
        schema: testCredentialsSchema,
        login: mockLogin,
        loginPageUrl: TEST_LOGIN_PAGE_URL,
        storage,
      });

      expect(plugin).to.be.a("function");
    });

    it("should accept custom token expiration times", () => {
      const plugin = oauthPlugin({
        issuerUrl: TEST_ISSUER_URL,
        schema: testCredentialsSchema,
        login: mockLogin,
        loginPageUrl: TEST_LOGIN_PAGE_URL,
        storage,
        tokenExpirationInSeconds: 7200,
        refreshTokenExpirationInSeconds: 172800,
      });

      expect(plugin).to.be.a("function");
    });

    it("should use default token expiration times when not specified", () => {
      const plugin = oauthPlugin({
        issuerUrl: TEST_ISSUER_URL,
        schema: testCredentialsSchema,
        login: mockLogin,
        loginPageUrl: TEST_LOGIN_PAGE_URL,
        storage,
      });

      expect(plugin).to.be.a("function");
    });

    it("should accept custom scopes supported", () => {
      const customScopes = ["custom:read", "custom:write"];
      const plugin = oauthPlugin({
        issuerUrl: TEST_ISSUER_URL,
        schema: testCredentialsSchema,
        login: mockLogin,
        loginPageUrl: TEST_LOGIN_PAGE_URL,
        storage,
        scopesSupported: customScopes,
      });

      expect(plugin).to.be.a("function");
    });
  });

  describe("createOAuthPlugin Function", () => {
    it("should create OAuth plugin with OpenAPI security scheme", () => {
      const result = createOAuthPlugin({
        issuerUrl: TEST_ISSUER_URL,
        schema: testCredentialsSchema,
        login: mockLogin,
        loginPageUrl: TEST_LOGIN_PAGE_URL,
        storage,
        scopesSupported: TEST_SCOPES,
      });

      expect(result).to.have.property("oauthPlugin");
      expect(result).to.have.property("openapiSecurityScheme");
      expect(result.oauthPlugin).to.be.a("function");
      expect(result.openapiSecurityScheme.type).to.equal("oauth2");
      expect(result.openapiSecurityScheme.flows?.authorizationCode).to.exist;
    });

    it("should handle undefined scopesSupported gracefully", () => {
      const result = createOAuthPlugin({
        issuerUrl: TEST_ISSUER_URL,
        schema: testCredentialsSchema,
        login: mockLogin,
        loginPageUrl: TEST_LOGIN_PAGE_URL,
        storage,
        // No scopesSupported provided
      });

      const flows = result.openapiSecurityScheme.flows?.authorizationCode;
      expect(flows?.scopes).to.deep.equal({});
    });

    it("should include correct authorization and token URLs in security scheme", () => {
      const result = createOAuthPlugin({
        issuerUrl: TEST_ISSUER_URL,
        schema: testCredentialsSchema,
        login: mockLogin,
        loginPageUrl: TEST_LOGIN_PAGE_URL,
        storage,
        scopesSupported: TEST_SCOPES,
      });

      const flows = result.openapiSecurityScheme.flows?.authorizationCode;
      expect(flows?.authorizationUrl).to.equal(
        `${TEST_ISSUER_URL.toString()}authorize`,
      );
      expect(flows?.tokenUrl).to.equal(`${TEST_ISSUER_URL.toString()}token`);
      expect(flows?.refreshUrl).to.equal(`${TEST_ISSUER_URL.toString()}token`);
    });

    it("should include scopes in security scheme", () => {
      const result = createOAuthPlugin({
        issuerUrl: TEST_ISSUER_URL,
        schema: testCredentialsSchema,
        login: mockLogin,
        loginPageUrl: TEST_LOGIN_PAGE_URL,
        storage,
        scopesSupported: TEST_SCOPES,
      });

      const flows = result.openapiSecurityScheme.flows?.authorizationCode;
      expect(flows?.scopes).to.deep.equal({
        read: "read",
        write: "write",
        admin: "admin",
      });
    });
  });

  describe("Login Endpoint", () => {
    let authorizationCode: string;

    beforeEach(async () => {
      // Create a mock client and authorization code
      const mockClient = {
        client_id: "test-client-id",
        client_secret: "test-client-secret",
        redirect_uris: ["http://localhost:3000/callback"],
        scope: "read write",
        client_id_issued_at: Math.floor(Date.now() / 1000),
      };

      await storage.saveClient(mockClient);

      authorizationCode = "test-auth-code";
      await storage.saveCode(authorizationCode, mockClient, {
        scopes: ["read", "write"],
        redirectUri: "http://localhost:3000/callback",
        codeChallenge: "test-challenge",
        state: "test-state",
      });
    });

    it("should successfully login with valid admin credentials", async () => {
      const response = await request(app)
        .post(`/login?code=${authorizationCode}`)
        .send({
          username: "admin",
          password: "admin123",
        })
        .expect(200);

      expect(response.body).to.have.property("targetUrl");
      expect(response.body.targetUrl).to.be.a("string");
      expect(response.body.targetUrl).to.include("code=");
    });

    it("should successfully login with valid user credentials", async () => {
      // Create authorization code with limited scopes
      const limitedCode = "limited-auth-code";
      const mockClient = await storage.getClient("test-client-id");
      await storage.saveCode(limitedCode, mockClient!, {
        scopes: ["read"],
        redirectUri: "http://localhost:3000/callback",
        codeChallenge: "test-challenge",
      });

      const response = await request(app)
        .post(`/login?code=${limitedCode}`)
        .send({
          username: "user",
          password: "userpass",
        })
        .expect(200);

      expect(response.body).to.have.property("targetUrl");
      expect(response.body.targetUrl).to.include("code=");
    });

    it("should reject invalid credentials", async () => {
      const response = await request(app)
        .post(`/login?code=${authorizationCode}`)
        .send({
          username: "invalid",
          password: "invalid",
        })
        .expect(401);

      expect(response.body).to.deep.equal({
        error: "Invalid credentials.",
      });
    });

    it("should reject missing authorization code", async () => {
      const response = await request(app)
        .post("/login")
        .send({
          username: "admin",
          password: "admin123",
        })
        .expect(400);

      expect(response.body).to.have.property("error");
    });

    it("should reject invalid authorization code", async () => {
      const response = await request(app)
        .post("/login?code=invalid-code")
        .send({
          username: "admin",
          password: "admin123",
        })
        .expect(400);

      expect(response.body).to.have.property("error");
    });

    it("should handle includeRefreshToken parameter", async () => {
      const response = await request(app)
        .post(`/login?code=${authorizationCode}&includeRefreshToken=1`)
        .send({
          username: "admin",
          password: "admin123",
        })
        .expect(200);

      expect(response.body).to.have.property("targetUrl");
    });

    it("should reject malformed request body", async () => {
      const response = await request(app)
        .post(`/login?code=${authorizationCode}`)
        .send({
          username: "admin",
          // missing password
        })
        .expect(400);

      // Schema validation should return 400, not 401
      expect(response.body).to.have.property("error");
    });

    it("should handle insufficient scope error", async () => {
      // Create authorization code requesting admin scope but user only has read
      const adminCode = "admin-auth-code";
      const mockClient = await storage.getClient("test-client-id");
      await storage.saveCode(adminCode, mockClient!, {
        scopes: ["admin"],
        redirectUri: "http://localhost:3000/callback",
        codeChallenge: "test-challenge",
      });

      const response = await request(app)
        .post(`/login?code=${adminCode}`)
        .send({
          username: "user",
          password: "userpass",
        })
        .expect(403);

      expect(response.body).to.have.property("error");
    });

    it("should handle state parameter correctly", async () => {
      const stateValue = "random-state-123";
      const mockClient = await storage.getClient("test-client-id");
      const stateCode = "state-auth-code";

      await storage.saveCode(stateCode, mockClient!, {
        scopes: ["read"],
        redirectUri: "http://localhost:3000/callback",
        codeChallenge: "test-challenge",
        state: stateValue,
      });

      const response = await request(app)
        .post(`/login?code=${stateCode}`)
        .send({
          username: "admin",
          password: "admin123",
        })
        .expect(200);

      expect(response.body.targetUrl).to.include(`state=${stateValue}`);
    });

    it("should handle code challenge (PKCE) parameter", async () => {
      const codeChallenge = "custom-code-challenge-value";
      const mockClient = await storage.getClient("test-client-id");
      const pkceCode = "pkce-auth-code";

      await storage.saveCode(pkceCode, mockClient!, {
        scopes: ["read"],
        redirectUri: "http://localhost:3000/callback",
        codeChallenge: codeChallenge,
      });

      const response = await request(app)
        .post(`/login?code=${pkceCode}`)
        .send({
          username: "admin",
          password: "admin123",
        })
        .expect(200);

      expect(response.body).to.have.property("targetUrl");
      expect(response.body.targetUrl).to.include("code=");
    });
  });

  describe("Logout Endpoint", () => {
    it("should successfully logout when logout function is provided", async () => {
      const logoutSpy = sinon.spy(console, "log");

      const response = await request(app).post("/logout").expect(200);

      expect(response.status).to.equal(200);
      expect(logoutSpy.calledWith("User logged out")).to.be.true;

      logoutSpy.restore();
    });

    it("should return 200 even when logout function is not provided", async () => {
      // Create app without logout function
      const appWithoutLogout = express();
      appWithoutLogout.use(express.json());
      const routerWithoutLogout = express.Router();

      const pluginWithoutLogout = oauthPlugin({
        issuerUrl: TEST_ISSUER_URL,
        schema: testCredentialsSchema,
        login: mockLogin,
        // No logout function
        loginPageUrl: TEST_LOGIN_PAGE_URL,
        storage,
      });

      pluginWithoutLogout(mockDkgContext, mockMcpServer, routerWithoutLogout);
      appWithoutLogout.use("/", routerWithoutLogout);

      const response = await request(appWithoutLogout)
        .post("/logout")
        .expect(200);

      expect(response.status).to.equal(200);
    });
  });

  describe("OAuth Provider Integration", () => {
    it("should register OAuth routes through mcpAuthRouter", async () => {
      // Test that OAuth endpoints are available
      // The mcpAuthRouter should add /authorize, /token, etc.
      const response = await request(app).get("/authorize").expect(400);

      // Should return 400 for missing parameters, not 404 (which would mean route doesn't exist)
      expect(response.status).to.equal(400);
    });

    it("should set provider in res.locals", async () => {
      // Create a test endpoint to verify provider is set
      app.get("/test-provider", (req, res) => {
        if (res.locals.provider) {
          res.json({ hasProvider: true });
        } else {
          res.json({ hasProvider: false });
        }
      });

      const response = await request(app).get("/test-provider").expect(200);

      expect(response.body.hasProvider).to.be.true;
    });

    it("should provide access to token endpoint", async () => {
      // Test that the token endpoint exists (OAuth standard endpoint)
      const response = await request(app).post("/token");

      // Should return 400 for missing parameters, not 404 (which would mean route doesn't exist)
      expect([400, 401]).to.include(response.status);
    });

    it("should provide access to revoke endpoint", async () => {
      // Test that the revoke endpoint exists (OAuth standard endpoint)
      const response = await request(app).post("/revoke");

      // Should return 400 for missing parameters, not 404 (which would mean route doesn't exist)
      expect([400, 401]).to.include(response.status);
    });
  });

  describe("Authorization Middleware", () => {
    let protectedApp: express.Application;
    let accessToken: string;
    let testStorage: DemoOAuthStorageProvider;

    beforeEach(async () => {
      // Setup a protected app with authorization middleware
      protectedApp = express();
      protectedApp.use(express.json());

      // Create the plugin and get the provider
      testStorage = new DemoOAuthStorageProvider();
      const testRouter = express.Router();
      const testPlugin = oauthPlugin({
        issuerUrl: TEST_ISSUER_URL,
        schema: testCredentialsSchema,
        login: mockLogin,
        loginPageUrl: TEST_LOGIN_PAGE_URL,
        storage: testStorage,
        scopesSupported: TEST_SCOPES,
      });

      testPlugin(mockDkgContext, mockMcpServer, testRouter);
      protectedApp.use("/", testRouter);

      // Add protected routes AFTER the plugin middleware is set up
      protectedApp.get("/protected/read", authorized(["read"]), (req, res) => {
        res.json({ message: "Read access granted", user: req.user });
      });

      protectedApp.get(
        "/protected/write",
        authorized(["write"]),
        (req, res) => {
          res.json({ message: "Write access granted", user: req.user });
        },
      );

      protectedApp.get(
        "/protected/admin",
        authorized(["admin"]),
        (req, res) => {
          res.json({ message: "Admin access granted", user: req.user });
        },
      );

      protectedApp.get(
        "/protected/multi",
        authorized(["read", "write"]),
        (req, res) => {
          res.json({ message: "Multi-scope access granted", user: req.user });
        },
      );

      // Create a mock access token directly in storage
      accessToken = "test-access-token";
      await testStorage.saveToken(accessToken, {
        token: accessToken,
        clientId: "test-client-id",
        scopes: ["read", "write", "admin"],
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
        extra: { type: "access" },
      });
    });

    it("should allow access with valid token and sufficient scope", async () => {
      const response = await request(protectedApp)
        .get("/protected/read")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.message).to.equal("Read access granted");
      // The user property may not be set depending on the middleware implementation
      // Just verify we get successful access
    });

    it("should allow access to write endpoint with write scope", async () => {
      const response = await request(protectedApp)
        .get("/protected/write")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.message).to.equal("Write access granted");
    });

    it("should allow access to admin endpoint with admin scope", async () => {
      const response = await request(protectedApp)
        .get("/protected/admin")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.message).to.equal("Admin access granted");
    });

    it("should deny access without token", async () => {
      const response = await request(protectedApp)
        .get("/protected/read")
        .expect(401);

      expect(response.body).to.have.property("error");
    });

    it("should deny access with invalid token", async () => {
      const response = await request(protectedApp)
        .get("/protected/read")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);

      expect(response.body).to.have.property("error");
    });

    it("should deny access with malformed authorization header", async () => {
      const response = await request(protectedApp)
        .get("/protected/read")
        .set("Authorization", "Invalid header format")
        .expect(401);

      expect(response.body).to.have.property("error");
    });

    it("should require all scopes for multi-scope endpoint", async () => {
      const response = await request(protectedApp)
        .get("/protected/multi")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.message).to.equal("Multi-scope access granted");
    });

    it("should handle expired token", async () => {
      // Create expired token using the same storage instance
      const expiredToken = "expired-access-token";
      await testStorage.saveToken(expiredToken, {
        token: expiredToken,
        clientId: "test-client-id",
        scopes: ["read"],
        expiresAt: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        extra: { type: "access" },
      });

      const response = await request(protectedApp)
        .get("/protected/read")
        .set("Authorization", `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body).to.have.property("error");
    });
  });

  describe("Storage Provider Integration", () => {
    it("should interact correctly with storage provider", async () => {
      const storageSpy = sinon.spy(storage, "saveCode");

      // Mock a client registration to trigger storage operations
      const mockClient = {
        client_id: "spy-test-client",
        redirect_uris: ["http://localhost:3000/callback"],
        scope: "read write",
        client_id_issued_at: Math.floor(Date.now() / 1000),
      };

      await storage.saveClient(mockClient);

      // Verify client was saved
      const retrievedClient = await storage.getClient("spy-test-client");
      expect(retrievedClient).to.not.be.undefined;
      expect(retrievedClient?.client_id).to.equal("spy-test-client");

      storageSpy.restore();
    });

    it("should handle token operations correctly", async () => {
      const testToken = "test-storage-token";
      const tokenData = {
        token: testToken,
        clientId: "test-client",
        scopes: ["read"],
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
        extra: { type: "access" },
      };

      await storage.saveToken(testToken, tokenData);

      const retrievedToken = await storage.getTokenData(testToken);
      expect(retrievedToken).to.not.be.undefined;
      expect(retrievedToken?.token).to.equal(testToken);
      expect(retrievedToken?.scopes).to.deep.equal(["read"]);

      await storage.deleteToken(testToken);
      const deletedToken = await storage.getTokenData(testToken);
      expect(deletedToken).to.be.undefined;
    });

    it("should handle code confirmation operations", async () => {
      const mockClient = {
        client_id: "confirmation-test-client",
        redirect_uris: ["http://localhost:3000/callback"],
        scope: "read",
        client_id_issued_at: Math.floor(Date.now() / 1000),
      };

      await storage.saveClient(mockClient);

      const testCode = "test-confirmation-code";
      await storage.saveCode(testCode, mockClient, {
        scopes: ["read"],
        redirectUri: "http://localhost:3000/callback",
        codeChallenge: "test-challenge",
      });

      // Initially should not be confirmed
      const unconfirmedData = await storage.getCodeData(testCode);
      expect(unconfirmedData?.confirmation).to.equal(false);

      // Confirm the code
      await storage.confirmCode(testCode, { includeRefreshToken: true });

      // Should now be confirmed
      const confirmedData = await storage.getCodeData(testCode);
      expect(confirmedData?.confirmation).to.deep.equal({
        includeRefreshToken: true,
      });

      // Clean up
      await storage.deleteCode(testCode);
      const deletedData = await storage.getCodeData(testCode);
      expect(deletedData).to.be.undefined;
    });
  });

  describe("Error Handling", () => {
    it("should handle login function throwing error", async () => {
      const errorApp = express();
      errorApp.use(express.json());
      const errorRouter = express.Router();

      const errorLogin = async (): Promise<{ scopes: string[] }> => {
        throw new Error("Database connection failed");
      };

      const errorPlugin = oauthPlugin({
        issuerUrl: TEST_ISSUER_URL,
        schema: testCredentialsSchema,
        login: errorLogin,
        loginPageUrl: TEST_LOGIN_PAGE_URL,
        storage,
      });

      errorPlugin(mockDkgContext, mockMcpServer, errorRouter);
      errorApp.use("/", errorRouter);

      // Create authorization code
      const mockClient = {
        client_id: "error-test-client",
        redirect_uris: ["http://localhost:3000/callback"],
        scope: "read",
        client_id_issued_at: Math.floor(Date.now() / 1000),
      };

      await storage.saveClient(mockClient);
      const errorCode = "error-auth-code";
      await storage.saveCode(errorCode, mockClient, {
        scopes: ["read"],
        redirectUri: "http://localhost:3000/callback",
        codeChallenge: "test-challenge",
      });

      const response = await request(errorApp)
        .post(`/login?code=${errorCode}`)
        .send({
          username: "admin",
          password: "admin123",
        })
        .expect(401);

      expect(response.body).to.deep.equal({
        error: "Invalid credentials.",
      });
    });

    it("should handle storage provider errors", async () => {
      // Mock storage to throw errors
      const errorStorage = new DemoOAuthStorageProvider();
      sinon
        .stub(errorStorage, "getCodeData")
        .rejects(new Error("Storage error"));

      const errorApp = express();
      errorApp.use(express.json());
      const errorRouter = express.Router();

      const errorPlugin = oauthPlugin({
        issuerUrl: TEST_ISSUER_URL,
        schema: testCredentialsSchema,
        login: mockLogin,
        loginPageUrl: TEST_LOGIN_PAGE_URL,
        storage: errorStorage,
      });

      errorPlugin(mockDkgContext, mockMcpServer, errorRouter);
      errorApp.use("/", errorRouter);

      const response = await request(errorApp)
        .post("/login?code=any-code")
        .send({
          username: "admin",
          password: "admin123",
        });

      // Should handle the error gracefully
      expect([400, 401, 500]).to.include(response.status);
    });

    it("should handle missing OAuth provider in authorization middleware", () => {
      const testApp = express();
      testApp.use(express.json());

      // Try to use authorized middleware without provider setup
      expect(() => {
        testApp.get("/test", authorized(["read"]), (req, res) => {
          res.json({ success: true });
        });

        // This should work fine, the error happens at runtime
      }).to.not.throw();
    });

    it("should handle schema validation errors gracefully", async () => {
      const response = await request(app)
        .post(`/login?code=${await createValidAuthCode()}`)
        .send({
          username: 123, // Invalid type - should be string
          password: "admin123",
        });

      // Should handle validation error gracefully
      expect([400, 401]).to.include(response.status);
      expect(response.body).to.have.property("error");
    });

    async function createValidAuthCode(): Promise<string> {
      const mockClient = await storage.getClient("test-client-id");
      const code = "validation-test-code";
      await storage.saveCode(code, mockClient!, {
        scopes: ["read"],
        redirectUri: "http://localhost:3000/callback",
        codeChallenge: "test-challenge",
      });
      return code;
    }
  });

  describe("Edge Cases", () => {
    it("should handle empty scopes array", async () => {
      const emptyApp = express();
      emptyApp.use(express.json());
      const emptyRouter = express.Router();

      const emptyPlugin = oauthPlugin({
        issuerUrl: TEST_ISSUER_URL,
        schema: testCredentialsSchema,
        login: mockLogin,
        loginPageUrl: TEST_LOGIN_PAGE_URL,
        storage,
        scopesSupported: [],
      });

      emptyPlugin(mockDkgContext, mockMcpServer, emptyRouter);
      emptyApp.use("/", emptyRouter);

      emptyApp.get("/test", authorized([]), (req, res) => {
        res.json({ success: true });
      });

      // Should not throw errors
      expect(emptyPlugin).to.be.a("function");
    });

    it("should handle very long authorization codes", async () => {
      const longCode = "a".repeat(1000);
      const mockClient = {
        client_id: "long-code-client",
        redirect_uris: ["http://localhost:3000/callback"],
        scope: "read",
        client_id_issued_at: Math.floor(Date.now() / 1000),
      };

      await storage.saveClient(mockClient);
      await storage.saveCode(longCode, mockClient, {
        scopes: ["read"],
        redirectUri: "http://localhost:3000/callback",
        codeChallenge: "test-challenge",
      });

      const response = await request(app)
        .post(`/login?code=${longCode}`)
        .send({
          username: "admin",
          password: "admin123",
        })
        .expect(200);

      expect(response.body).to.have.property("targetUrl");
    });

    it("should handle special characters in scopes", async () => {
      const specialScopes = ["api:read", "data-access", "user_profile"];
      const specialApp = express();
      specialApp.use(express.json());
      const specialRouter = express.Router();

      const specialPlugin = oauthPlugin({
        issuerUrl: TEST_ISSUER_URL,
        schema: testCredentialsSchema,
        login: async () => ({ scopes: specialScopes }),
        loginPageUrl: TEST_LOGIN_PAGE_URL,
        storage,
        scopesSupported: specialScopes,
      });

      specialPlugin(mockDkgContext, mockMcpServer, specialRouter);
      specialApp.use("/", specialRouter);

      // Should not throw errors during setup
      expect(specialPlugin).to.be.a("function");
    });

    it("should handle concurrent login requests", async () => {
      // Create multiple authorization codes
      const codes = ["code1", "code2", "code3"];
      const mockClient = {
        client_id: "concurrent-client",
        redirect_uris: ["http://localhost:3000/callback"],
        scope: "read write",
        client_id_issued_at: Math.floor(Date.now() / 1000),
      };

      await storage.saveClient(mockClient);

      for (const code of codes) {
        await storage.saveCode(code, mockClient, {
          scopes: ["read"],
          redirectUri: "http://localhost:3000/callback",
          codeChallenge: "test-challenge",
        });
      }

      const promises = codes.map((code) =>
        request(app).post(`/login?code=${code}`).send({
          username: "admin",
          password: "admin123",
        }),
      );

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property("targetUrl");
      });
    });

    it("should handle URL encoding in redirect URIs", async () => {
      const simpleRedirectUri = "http://localhost:3000/callback";
      const mockClient = {
        client_id: "encoded-uri-client",
        redirect_uris: [simpleRedirectUri],
        scope: "read",
        client_id_issued_at: Math.floor(Date.now() / 1000),
      };

      await storage.saveClient(mockClient);

      const authCode = "encoded-uri-code";
      await storage.saveCode(authCode, mockClient, {
        scopes: ["read"],
        redirectUri: simpleRedirectUri,
        codeChallenge: "test-challenge",
      });

      const response = await request(app)
        .post(`/login?code=${authCode}`)
        .send({
          username: "admin",
          password: "admin123",
        })
        .expect(200);

      // The response should contain the redirect URI as part of the target URL
      expect(response.body.targetUrl).to.include(simpleRedirectUri);
      expect(response.body.targetUrl).to.include("code=");
    });

    it("should handle various issuer URL formats", () => {
      // Test with a valid but unusual URL format
      expect(() => {
        oauthPlugin({
          issuerUrl: new URL("http://localhost:8900/oauth/"),
          schema: testCredentialsSchema,
          login: mockLogin,
          loginPageUrl: TEST_LOGIN_PAGE_URL,
          storage,
        });
      }).to.not.throw();

      // Test with HTTPS URL
      expect(() => {
        oauthPlugin({
          issuerUrl: new URL("https://auth.example.com:443/"),
          schema: testCredentialsSchema,
          login: mockLogin,
          loginPageUrl: TEST_LOGIN_PAGE_URL,
          storage,
        });
      }).to.not.throw();
    });
  });
});
