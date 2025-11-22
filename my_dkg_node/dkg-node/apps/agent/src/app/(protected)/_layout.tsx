import { useCallback, useEffect, useState } from "react";
import { router, Slot, useGlobalSearchParams, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

import { McpContextProvider } from "@/client";
import { useAlerts } from "@/components/Alerts";
import { SettingsProvider } from "@/hooks/useSettings";

export default function ProtectedLayout() {
  const params = useGlobalSearchParams<{ code?: string; error?: string }>();
  const { showAlert } = useAlerts();

  const [idleMcp, setIdleMcp] = useState(false);
  const [idleSettings, setIdleSettings] = useState(false);

  const mcpCallback = useCallback(
    (error?: Error) => {
      setIdleMcp(true);

      if (!error) router.setParams({ code: undefined });
      else
        showAlert({
          type: "error",
          title: "MCP Error",
          message: error.message,
          timeout: 5000,
        });
    },
    [showAlert],
  );

  const errorCode = params.error;
  useEffect(() => {
    if (errorCode)
      mcpCallback(
        new Error(
          `Connection to the MCP Server failed with error code: "${errorCode}"\n` +
            "Try cleaning localStorage and going to the login page.",
        ),
      );
  }, [errorCode, mcpCallback]);

  const isLoginFlow = usePathname() === "/login" && !!params.code;

  const settingsCallback = useCallback(
    (error?: Error) => {
      setIdleSettings(true);

      if (error)
        showAlert({
          type: "error",
          title: "Settings Error",
          message: error.message,
          timeout: 5000,
        });
    },
    [showAlert],
  );

  useEffect(() => {
    if (idleMcp && idleSettings) SplashScreen.hide();
  }, [idleMcp, idleSettings]);

  return (
    <SettingsProvider onLoaded={settingsCallback} onError={settingsCallback}>
      <McpContextProvider
        autoconnect={
          errorCode || isLoginFlow
            ? false
            : {
                authorizationCode: params.code,
                callback: mcpCallback,
              }
        }
        onMcpError={mcpCallback}
      >
        <Slot />
      </McpContextProvider>
    </SettingsProvider>
  );
}
