import { DkgPlugin } from "@dkg/plugins";
import type { express } from "@dkg/plugins/types";
import { openAPIRoute, z } from "@dkg/plugin-swagger";
import {
  OAuthServerProvider,
  type AuthorizationParams,
} from "@modelcontextprotocol/sdk/server/auth/provider.js";
import {
  InsufficientScopeError,
  OAuthError,
  ServerError,
} from "@modelcontextprotocol/sdk/server/auth/errors.js";
import { requireBearerAuth } from "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js";
import type { SecuritySchemeObject } from "openapi3-ts/oas31";
import { Router } from "express";

import DemoOAuthStorageProvider from "./storage/demo";
import makeProvider, {
  OAuthStorageProvider,
  CodeConfirmationData,
} from "./makeProvider";

/**
 * Custom OAuth metadata router that bypasses the SDK's HTTPS validation.
 * This provides the same OAuth endpoints as mcpAuthRouter but without HTTPS enforcement.
 */
function createCustomOAuthRouter(options: {
  issuerUrl: URL;
  provider: OAuthServerProvider;
  scopesSupported?: string[];
}) {
  const { issuerUrl, provider, scopesSupported } = options;
  const router = Router();

  const isHttpNonLocalhost =
    issuerUrl.protocol === "http:" &&
    !issuerUrl.hostname.match(/^(localhost|127\.0\.0\.1|::1)$/);

  if (isHttpNonLocalhost) {
    console.warn(
      `⚠️  WARNING: Using HTTP for OAuth issuer URL in production is insecure!
      Current URL: ${issuerUrl.toString()}
      For production, please set up HTTPS using a reverse proxy (nginx + Let's Encrypt)
      or use a tunneling service like cloudflared or ngrok.`,
    );
  }

  // Serve OAuth metadata with the ACTUAL issuer URL (not converted to localhost)
  router.get("/.well-known/oauth-protected-resource", (_, res) => {
    res.json({
      resource: issuerUrl.toString() + "mcp",
      authorization_servers: [issuerUrl.toString()],
    });
  });

  router.get("/.well-known/oauth-protected-resource/mcp", (_, res) => {
    res.json({
      resource: issuerUrl.toString() + "mcp",
      authorization_servers: [issuerUrl.toString()],
    });
  });

  // OAuth server metadata
  router.get("/.well-known/oauth-authorization-server", (_, res) => {
    res.json({
      issuer: issuerUrl.toString(),
      authorization_endpoint: issuerUrl.toString() + "authorize",
      token_endpoint: issuerUrl.toString() + "token",
      registration_endpoint: issuerUrl.toString() + "register",
      revocation_endpoint: issuerUrl.toString() + "revoke",
      scopes_supported: scopesSupported || [],
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: ["none"],
    });
  });

  // OAuth authorize endpoint - handles OAuth authorization requests
  router.get("/authorize", async (req, res) => {
    try {
      const clientId = req.query.client_id as string;
      if (!clientId) {
        return res.status(400).json({ error: "Missing client_id" });
      }

      const client = await provider.clientsStore.getClient(clientId);
      if (!client) {
        return res.status(400).json({ error: "invalid_client" });
      }

      const params: AuthorizationParams = {
        redirectUri: req.query.redirect_uri as string,
        state: req.query.state as string,
        scopes: (req.query.scope as string)?.split(" ") || [],
        codeChallenge: req.query.code_challenge as string,
        resource: req.query.resource
          ? new URL(req.query.resource as string)
          : undefined,
      };

      // authorize() calls res.redirect internally
      await provider.authorize(client, params, res);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(400).json({ error: message });
    }
  });

  // OAuth token endpoint - handles token exchange and refresh
  router.post("/token", async (req, res) => {
    try {
      const grantType = req.body.grant_type;
      const clientId = req.body.client_id;

      if (!clientId) {
        return res.status(400).json({ error: "Missing client_id" });
      }

      const client = await provider.clientsStore.getClient(clientId);
      if (!client) {
        return res.status(400).json({ error: "Invalid client_id" });
      }

      if (grantType === "authorization_code") {
        const code = req.body.code;
        const codeVerifier = req.body.code_verifier;

        // Verify PKCE challenge if present
        if (codeVerifier) {
          // PKCE verification would go here - simplified for now
          // await provider.challengeForAuthorizationCode(client, code);
        }

        const tokens = await provider.exchangeAuthorizationCode(client, code);
        return res.json(tokens);
      } else if (grantType === "refresh_token") {
        const refreshToken = req.body.refresh_token;
        const scope = req.body.scope?.split(" ");
        const resource = req.body.resource
          ? new URL(req.body.resource)
          : undefined;

        const tokens = await provider.exchangeRefreshToken(
          client,
          refreshToken,
          scope,
          resource,
        );
        return res.json(tokens);
      } else {
        return res.status(400).json({ error: "Unsupported grant_type" });
      }
    } catch (error: unknown) {
      const errorObj =
        error && typeof error === "object" && "error" in error
          ? (error as { error?: string; message?: string })
          : null;
      res.status(400).json({
        error: errorObj?.error || "invalid_request",
        error_description:
          errorObj?.message ||
          (error instanceof Error ? error.message : "Unknown error"),
      });
    }
  });

  // Dynamic client registration endpoint
  router.post("/register", async (req, res) => {
    try {
      const clientInfo = req.body;

      // Validate required fields
      if (
        !clientInfo.redirect_uris ||
        !Array.isArray(clientInfo.redirect_uris)
      ) {
        return res.status(400).json({
          error: "invalid_client_metadata",
          error_description: "redirect_uris is required and must be an array",
        });
      }

      // Check if registerClient is available
      if (!provider.clientsStore.registerClient) {
        return res.status(501).json({
          error: "unsupported_operation",
          error_description: "Dynamic client registration is not supported",
        });
      }

      // Register the client
      const registeredClient =
        await provider.clientsStore.registerClient(clientInfo);

      // Return the registered client information
      res.status(201).json(registeredClient);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(400).json({
        error: "invalid_client_metadata",
        error_description: message,
      });
    }
  });

  // Token revocation endpoint (RFC 7009)
  router.post("/revoke", async (req, res) => {
    try {
      const clientId = req.body.client_id;
      const token = req.body.token;
      const tokenTypeHint = req.body.token_type_hint; // Optional: "access_token" or "refresh_token"

      // Validate client_id
      if (!clientId) {
        return res.status(400).json({
          error: "invalid_request",
          error_description: "Missing client_id",
        });
      }

      // Validate token
      if (!token) {
        return res.status(400).json({
          error: "invalid_request",
          error_description: "Missing token parameter",
        });
      }

      const client = await provider.clientsStore.getClient(clientId);
      if (!client) {
        return res.status(400).json({
          error: "invalid_client",
          error_description: "Invalid client_id",
        });
      }

      // Check if revokeToken is available
      if (!provider.revokeToken) {
        return res.status(501).json({
          error: "unsupported_operation",
          error_description: "Token revocation is not supported",
        });
      }

      // Revoke the token
      // Per RFC 7009, the authorization server responds with HTTP 200
      // even if the token does not exist or is already revoked
      await provider.revokeToken(client, {
        token,
        token_type_hint: tokenTypeHint,
      });

      // Success - return 200 OK with no content
      res.status(200).send();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(503).json({
        error: "server_error",
        error_description: message,
      });
    }
  });

  return router;
}

export { DemoOAuthStorageProvider };
export type { OAuthStorageProvider, CodeConfirmationData };

const oauthPlugin =
  <Credentials>({
    issuerUrl,
    schema,
    login,
    logout,
    loginPageUrl,
    storage,
    scopesSupported,
    tokenExpirationInSeconds = 3600, // 1h
    refreshTokenExpirationInSeconds = 86400, // 1d
  }: {
    issuerUrl: URL;
    schema: z.Schema<Credentials>;
    login: (credentials: Credentials) => Promise<{
      scopes: string[];
      extra?: Record<string, unknown>;
    }>;
    logout?: () => Promise<void>;
    loginPageUrl: URL;
    storage: OAuthStorageProvider;
    tokenExpirationInSeconds?: number;
    refreshTokenExpirationInSeconds?: number;
    scopesSupported?: string[];
  }): DkgPlugin =>
  (_, __, api) => {
    const provider = makeProvider({
      storage,
      scopesSupported,
      tokenExpirationInSeconds,
      refreshTokenExpirationInSeconds,
      loginPageUrl,
    });

    api.post(
      "/login",
      openAPIRoute(
        {
          tag: "Auth",
          summary: "Login route",
          description:
            "Confirm user credentials and enable the OAuth code for the client",
          query: z.object({
            code: z.string({ message: "Missing code parameter." }).openapi({
              description:
                "Authorization code, retrieved from oauth server's /authorize route",
            }),
            includeRefreshToken: z.enum(["1", "0"]).optional().openapi({
              description:
                "If a refresh token should be issued. Used in 'remember me' sign in functionality.",
            }),
          }),
          body: schema,
          response: {
            description: "User logged in successfully",
            schema: z.object({
              targetUrl: z.string().openapi({
                description:
                  "URL to redirect to in order to complete the oauth flow. " +
                  "Includes the authorization code.",
              }),
            }),
          },
        },
        async (req, res) => {
          try {
            const authorizationCode = req.query.code;
            const credentials = await schema.parseAsync(req.body);
            const user = await login(credentials);

            const targetUrl = await provider.authorizeConfirm(
              authorizationCode,
              {
                includeRefreshToken: req.query.includeRefreshToken === "1",
                scopes: user.scopes,
                extra: user.extra,
              },
            );

            res.status(200).json({ targetUrl: targetUrl.toString() });
          } catch (error) {
            if (error instanceof InsufficientScopeError) {
              res.status(403).json(error.toResponseObject());
            } else if (error instanceof ServerError) {
              res.status(500).json(error.toResponseObject());
            } else if (error instanceof OAuthError) {
              res.status(400).json(error.toResponseObject());
            } else {
              res.status(401).json({ error: "Invalid credentials." });
            }
          }
        },
      ),
    );

    api.post(
      "/logout",
      openAPIRoute(
        {
          tag: "Auth",
          summary: "Logout route",
          description:
            "If implemented, runs the logout function. If not, just returns a 200 response.",
          response: {
            description: "Logout successful",
            schema: z.any(),
          },
        },
        async (_, res) => {
          if (logout) await logout();
          res.status(200).send();
        },
      ),
    );

    // Use custom OAuth router instead of mcpAuthRouter to support HTTP
    api.use(
      createCustomOAuthRouter({
        issuerUrl,
        provider,
        scopesSupported,
      }),
    );

    api.use((_, res, next) => {
      res.locals.provider = provider;
      next();
    });
  };

export default oauthPlugin;

export const createOAuthPlugin = <Credentials>(
  opts: Parameters<typeof oauthPlugin<Credentials>>[0],
) => {
  const plugin = oauthPlugin<Credentials>(opts);
  const openapiSecurityScheme: SecuritySchemeObject = {
    type: "oauth2",
    flows: {
      authorizationCode: {
        scopes: Object.fromEntries(
          (opts.scopesSupported ?? []).map((scope) => [scope, scope]),
        ),
        authorizationUrl: `${opts.issuerUrl.toString()}authorize`,
        tokenUrl: `${opts.issuerUrl.toString()}token`,
        refreshUrl: `${opts.issuerUrl.toString()}token`,
      },
    },
  };

  return {
    oauthPlugin: plugin,
    openapiSecurityScheme,
  };
};

/**
 * Middleware to check if the user is authorized for a given scope.
 *
 * It will also expose the `AuthInfo` object for the logged-in user
 * in the response locals, `res.locals.auth`
 *
 * @param scope {string[]} - The scope to check for authorization.
 * @returns {express.Handler} An Express middleware function.
 */
export const authorized =
  (scope: string[]): express.Handler =>
  (req, res, next) => {
    const provider: OAuthServerProvider = res.locals.provider;
    if (!provider) throw new Error("OAuth provider not initialized");

    return requireBearerAuth({
      verifier: {
        verifyAccessToken: provider.verifyAccessToken,
      },
      requiredScopes: scope,
    })(req, res, (arg) => {
      res.locals.auth = req.auth;
      next(arg);
    });
  };
