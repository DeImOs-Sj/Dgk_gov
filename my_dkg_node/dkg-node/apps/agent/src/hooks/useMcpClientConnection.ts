import { useMemo, useRef, useCallback, useState, useEffect } from "react";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { UnauthorizedError } from "@modelcontextprotocol/sdk/client/auth.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { ToolListChangedNotificationSchema } from "@modelcontextprotocol/sdk/types.js";
import {
  InvalidGrantError,
  InvalidTokenError,
} from "@modelcontextprotocol/sdk/server/auth/errors.js";

export interface StreamableHTTPClientTransportWithTokenRetrieval
  extends StreamableHTTPClientTransport {
  getToken: () => Promise<string | undefined>;
  logout?: () => Promise<void>;
}

export type ToolInfo = {
  name: string;
  title?: string;
  description?: string;
  args: Record<string, unknown>;
};

export default function useMcpClientConnection({
  url,
  name,
  version,
  transportFactory,
  onError,
  ping = 5000,
}: {
  url: string;
  name: string;
  version: string;
  transportFactory: (
    url: string,
  ) => StreamableHTTPClientTransportWithTokenRetrieval;
  onError?: (error: Error) => void;
  ping?: number | boolean;
}) {
  const mcp = useMemo(() => {
    const c = new Client({ name, version });
    const _connect = c.connect;
    return Object.assign(c, { _connect });
  }, [name, version]);
  const transport = useRef(transportFactory(url));
  const [connected, setConnected] = useState(false);

  const handleError = useCallback(
    (error: unknown) => {
      console.debug("[MCP] Error:", error);
      onError?.(
        error instanceof Error ? error : new Error(`Unknown error: ${error}`),
      );
    },
    [onError],
  );

  const disconnect = useCallback(async () => {
    await mcp.close().catch(handleError);
    await transport.current.logout?.();
    transport.current = transportFactory(url);
    setConnected(false);
    console.debug("[MCP] Disconnected");
  }, [mcp, handleError, url, transportFactory]);

  const connect = useCallback(
    async (authorizationCode?: string) => {
      console.debug("[MCP] Connecting...");
      try {
        transport.current = transportFactory(url);
        if (authorizationCode) {
          await transport.current.finishAuth(authorizationCode);
          console.debug("[MCP] Authorization successful.");
        }

        await mcp._connect(transport.current);
        setConnected(true);
        console.debug(
          "[MCP] Connected to transport",
          transport.current.sessionId,
        );
      } catch (error: unknown) {
        if (error instanceof UnauthorizedError) {
          setConnected(false);
          console.debug("[MCP] Unauthorized, trying to authorize...");
          return;
        }
        if (
          error instanceof InvalidGrantError ||
          error instanceof InvalidTokenError
        ) {
          await disconnect();
          console.debug("[MCP] Invalid grant or token, trying to authorize...");
          return connect();
        }
        throw error;
      }
    },
    [mcp, transportFactory, url, disconnect],
  );

  const [token, setToken] = useState<string>();
  const fetchToken = useCallback(
    () =>
      mcp
        .ping()
        .then(() => transport.current.getToken())
        .catch(() => {
          disconnect();
          return undefined;
        }),
    [mcp, disconnect],
  );

  const [tools, setTools] = useState<ToolInfo[]>([]);
  const fetchTools = useCallback(
    () =>
      mcp.listTools().then(({ tools }) =>
        tools.map((t) => ({
          name: t.name,
          title: t.title,
          description: t.description,
          args: t.inputSchema,
        })),
      ),
    [mcp],
  );

  useEffect(() => {
    if (!connected) {
      setToken(undefined);
      setTools([]);
      return;
    }

    fetchToken().then(setToken);
    fetchTools().then(setTools).catch(handleError);
    mcp.setNotificationHandler(ToolListChangedNotificationSchema, () =>
      fetchTools().then(setTools).catch(handleError),
    );
  }, [connected, mcp, fetchToken, fetchTools, handleError]);

  const intervalRef = useRef<number | null>(null);
  useEffect(() => {
    if (connected && ping)
      intervalRef.current = setInterval(
        () => fetchToken().then(setToken),
        typeof ping === "number" ? ping : 5000,
      );
    else if (intervalRef.current) clearInterval(intervalRef.current);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [connected, mcp, ping, fetchToken]);

  return useMemo(
    () =>
      Object.assign(mcp, {
        name,
        connect,
        disconnect,
        connected,
        token,
        tools,
        getToolInfo: (name: string) => tools.find((t) => t.name === name),
      }),
    [mcp, name, connect, disconnect, connected, token, tools],
  );
}

export type McpClient = ReturnType<typeof useMcpClientConnection>;
