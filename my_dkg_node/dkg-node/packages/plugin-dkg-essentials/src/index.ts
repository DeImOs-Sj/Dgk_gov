import { defineDkgPlugin } from "@dkg/plugins";

import blobsPlugin from "./plugins/blobs";
import dkgToolsPlugin from "./plugins/dkg-tools";

export { dkgToolsPlugin, blobsPlugin };

export default defineDkgPlugin((ctx, mcp, api) => {
  blobsPlugin(ctx, mcp, api);
  dkgToolsPlugin(ctx, mcp, api);
});
