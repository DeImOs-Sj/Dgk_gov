/** MIT License

Copyright (c) 2024 Foundry 376

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE. */

import {
  OpenApiGeneratorV3,
  OpenApiGeneratorV31,
  OpenAPIRegistry,
  ResponseConfig,
  RouteConfig,
} from "@asteasolutions/zod-to-openapi";
import { OpenApiVersion } from "@asteasolutions/zod-to-openapi/dist/openapi-generator";
import type { RequestHandler, Router } from "express";
import type { ComponentsObject } from "openapi3-ts/oas31";

import { z } from "./z";
import { getSchemaOfOpenAPIRoute } from "./openAPIRoute";

export type OpenAPIDocument = ReturnType<
  OpenApiGeneratorV3["generateDocument"]
>;
export type OpenAPIV31Document = ReturnType<
  OpenApiGeneratorV31["generateDocument"]
>;
export type OpenAPIComponents = ReturnType<
  OpenApiGeneratorV3["generateComponents"]
>;
export type OpenAPIConfig = Parameters<
  OpenApiGeneratorV3["generateDocument"]
>[0];

export type OpenAPIResponse = {
  schema: z.ZodTypeAny;
  contentType?: string;
  description?: string;
};

export function buildOpenAPIDocument(args: {
  config: Omit<OpenAPIConfig, "openapi">;
  globalResponses?: {
    [code: number]: OpenAPIResponse;
  };
  routers: Router[];
  securitySchemes?: ComponentsObject["securitySchemes"];
  openApiVersion: OpenApiVersion;
}): OpenAPIDocument | OpenAPIV31Document {
  const { config, globalResponses, routers, securitySchemes, openApiVersion } =
    args;
  const registry = new OpenAPIRegistry();
  // Attach all the API routes, referencing the named components where
  // possible, and falling back to inlining the Zod shapes.
  getRoutes(routers).forEach(({ path, method, handler }) => {
    const {
      tag,
      body,
      params,
      query,
      response,
      description,
      summary,
      security,
      deprecated,
      finalizeRouteConfig,
    } = getSchemaOfOpenAPIRoute(handler) || {};

    //Express: /path/to/:variable/something -> OpenAPI /path/to/{variable}/something
    const pathOpenAPIFormat = path
      .split("/")
      .filter((p) => p.includes(":"))
      .reduce(
        (iPath, replaceMe) =>
          iPath.replace(
            new RegExp(replaceMe, "gi"),
            `{${replaceMe.substring(1)}}`,
          ),
        path,
      );

    const possibleResponses: {
      [statusCode: string]: ResponseConfig;
    } = {};

    if (globalResponses)
      Object.entries(globalResponses).map(([statusCode, response]) => {
        possibleResponses[statusCode] = {
          description: response.description ?? "",
          content: {
            [response.contentType ?? "application/json"]: {
              schema: response.schema,
            },
          },
        };
      });

    if (response)
      possibleResponses[200] = {
        description: response.description ?? "",
        content: {
          [response.contentType ?? "application/json"]: {
            schema: response.schema,
          },
        },
      };

    // If the request includes path parameters, a 404 error is most likely possible
    if (params) {
      possibleResponses[404] = {
        description: "The item you requested could not be found",
      };
    }

    // If the request includes a query string or request body, Zod 400 errors are possible
    if (query || body) {
      possibleResponses[400] = {
        description:
          "The request payload or query string parameter you passed was not valid",
        content: {
          "application/json": {
            schema: z.object({ error: z.string() }),
          },
        },
      };
    }

    let openapiRouteConfig: RouteConfig = {
      tags: [tag || "default"],
      method: method,
      summary: summary,
      path: pathOpenAPIFormat,
      description: description,
      deprecated: deprecated,
      security: security ? [{ [security]: [] }] : [{ oauth2: [], bearer: [] }],
      request: {
        params: asZodObject(params),
        query: asZodObject(query),
        body: body
          ? {
              content: {
                "application/json": {
                  schema: body,
                },
              },
            }
          : undefined,
      },
      responses: possibleResponses,
    };
    if (finalizeRouteConfig) {
      openapiRouteConfig = finalizeRouteConfig(openapiRouteConfig);
    }

    registry.registerPath(openapiRouteConfig);
  });

  const generator =
    openApiVersion === "3.1.0"
      ? new OpenApiGeneratorV31(registry.definitions)
      : new OpenApiGeneratorV3(registry.definitions);
  const openapiJSON = generator.generateDocument({
    ...config,
    openapi: openApiVersion,
  });

  // Attach the security schemes provided
  if (securitySchemes) {
    openapiJSON.components!.securitySchemes ||= {};
    Object.assign(openapiJSON.components!.securitySchemes, securitySchemes);
  }

  // Verify that none of the "parameters" are appearing as optional, which is invalid
  // in the official OpenAPI spec and unsupported by readme.io
  if (openapiJSON.paths) {
    for (const [route, impl] of Object.entries(openapiJSON.paths)) {
      for (const key of Object.keys(impl)) {
        const method = key as keyof typeof impl;
        for (const param of impl[method].parameters || []) {
          if (param.required === false && param.in === "path") {
            param.required = true;
            console.warn(
              `OpenAPI Warning: The route ${route} has an optional parameter ${param.name} in the path. ` +
                `Optional parameters in the route path are not supported by readme.io. Make the parameter required ` +
                `or split the route definition into two separate ones, one with the param and one without.`,
            );
          }
        }
      }
    }
  }
  return openapiJSON;
}

// Helpers
const asZodObject = (type?: z.ZodType) => {
  if (type && type instanceof z.ZodObject) {
    return type;
  }
  return undefined;
};

// Disable naming convention because fast_slash comes from Express.
const regexPrefixToString = (path?: {
  fast_slash: unknown;
  toString: () => string;
}): string => {
  if (!path) return "";
  if (path.fast_slash) {
    return "";
  }
  return path
    .toString()
    .replace(`/^\\`, "")
    .replace("(?:\\/(?=$))?(?=\\/|$)/i", "");
};

export const getRoutes = (routers: Router[]) => {
  const routes: {
    path: string;
    method: "get" | "post" | "put" | "delete";
    handler: RequestHandler;
  }[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const processMiddleware = (middleware: any, prefix = ""): void => {
    if (middleware.name === "router" && middleware.handle.stack) {
      for (const subMiddleware of middleware.handle.stack) {
        processMiddleware(
          subMiddleware,
          // Use 'prefix' property of a patched express.Router
          //
          // Every router used in the express application needs to register
          // it's own prefix as an additional property. This is required
          // because express layers no longer provide the 'regexp' property.
          `${prefix}${regexPrefixToString(middleware.handle.prefix)}`,
        );
      }
    }
    if (!middleware.route) {
      return;
    }

    const path = `${prefix}${middleware.route.path}`;
    // Ignore middleware with '/' path, not useful
    if (path === "/") return;

    routes.push({
      path,
      method: middleware.route.stack[0].method,
      handler: middleware.route.stack[middleware.route.stack.length - 1].handle,
    });
  };
  // Can remove this any when @types/express upgrades to v5
  for (const router of routers) {
    for (const middleware of router.stack) {
      processMiddleware(middleware);
    }
  }
  return routes;
};
