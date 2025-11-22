import path from "path";
import { defineDkgPlugin } from "@dkg/plugins";
import { express } from "@dkg/plugins/helpers";
import { createRequestHandler } from "@expo/server/adapter/express";

export default (outputPath: string) =>
  defineDkgPlugin((_ctx, _mcp, api) => {
    api.use(
      express.static(path.join(outputPath, "client"), {
        maxAge: "1h",
        extensions: ["html"],
      }),
    );

    api.all("/{*all}", (req, res, next) => {
      if (req.path === "/mcp") next();
      else
        createRequestHandler({
          build: path.join(outputPath, "server"),
        })(req, res, next);
    });
  });
