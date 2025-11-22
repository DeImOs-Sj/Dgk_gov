import McpContextProvider, { useMcpContext } from "./McpContextProvider";
import { clientUri } from "./createTransport";

const useMcpClient = () => {
  return useMcpContext().mcp;
};

export { clientUri, McpContextProvider, useMcpContext, useMcpClient };
