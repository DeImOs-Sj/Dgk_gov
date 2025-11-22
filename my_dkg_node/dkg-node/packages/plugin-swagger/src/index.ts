import { DkgPlugin } from "@dkg/plugins";
import swaggerUI from "swagger-ui-express";
import type {
  ServerObject,
  SecuritySchemeObject,
  ReferenceObject,
} from "openapi3-ts/oas31";
import type { Express } from "express";

import { buildOpenAPIDocument, OpenAPIResponse } from "./openAPI";

export { z } from "./z";
export { openAPIRoute } from "./openAPIRoute";
export type { OpenAPIResponse };

export default ({
    globalResponses,
    version,
    servers,
    securitySchemes,
  }: {
    globalResponses?: Record<string, OpenAPIResponse>;
    version: string;
    servers?: ServerObject[];
    securitySchemes?: {
      [name: string]: SecuritySchemeObject | ReferenceObject;
    };
  }): DkgPlugin =>
  (ctx, _mcp, api) => {
    let openAPIDocument = {};
    // This is safe because this plugin can only be used at the root level
    // We are not using 'defineDkgPlugin' and therefor users cannot register
    // it as a nested plugin on a Router instance.
    const router = (api as Express).router;
    if (!router) return;

    try {
      openAPIDocument = buildOpenAPIDocument({
        openApiVersion: "3.1.0",
        routers: [router],
        globalResponses,
        securitySchemes,
        config: {
          info: {
            title: "DKG API",
            version: version,
            description: "DKG plugins API",
          },
          servers,
        },
      });
    } catch (error: unknown) {
      // Don't break the server
      console.error("Failed to build OpenAPI document:", error);
    }
    api.get("/openapi", (_req, res) => {
      res.json(openAPIDocument);
    });
    api.use("/swagger", swaggerUI.serve);
    api.get(
      "/swagger",
      swaggerUI.setup(openAPIDocument, {
        swaggerOptions: {
          oauth: {
            usePkceWithAuthorizationCodeGrant: true,
            clientId: "swagger-client",
            clientSecret: "swagger-secret",
          },
        },
      }),
    );
  };
