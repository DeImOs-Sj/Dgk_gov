import { createContext, useContext, PropsWithChildren, useEffect } from "react";

import { toError } from "@/shared/errors";
import useMcpClientConnection, {
  McpClient,
} from "@/hooks/useMcpClientConnection";

import createTransport from "./createTransport";

const McpContext = createContext<{
  mcp: McpClient;
}>({
  mcp: null as any,
});

export const useMcpContext = () => useContext(McpContext);

export default function McpContextProvider({
  autoconnect = true,
  onMcpError,
  children,
}: PropsWithChildren<{
  autoconnect?:
    | boolean
    | {
        authorizationCode?: string;
        callback?: (error?: Error) => void;
      };
  onMcpError?: (error: Error) => void;
}>) {
  const mcp = useMcpClientConnection({
    url: process.env.EXPO_PUBLIC_MCP_URL + "/mcp",
    name: "dkg-agent",
    version: "1.0.0",
    transportFactory: createTransport,
    onError: onMcpError,
  });

  const tryConnect = autoconnect && !mcp.connected;
  const { authorizationCode, callback } =
    typeof autoconnect === "object" ? autoconnect : {};

  useEffect(() => {
    if (!tryConnect) return;

    mcp
      .connect(authorizationCode)
      .then(() => callback?.())
      .catch((err) => callback?.(toError(err)));
  }, [tryConnect, mcp, authorizationCode, callback]);

  return <McpContext.Provider value={{ mcp }}>{children}</McpContext.Provider>;
}
