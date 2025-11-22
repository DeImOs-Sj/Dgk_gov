import "../polyfills";
import { View } from "react-native";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_800ExtraBold,
} from "@expo-google-fonts/manrope";
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import Background from "@/components/layout/Background";
import Alerts from "@/components/Alerts";
import Container from "@/components/layout/Container";
import Dialog from "@/components/Dialog";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_800ExtraBold,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Dialog.Provider>
        <Alerts.Provider>
          <Dialog />
          <Background>
            <View
              style={{
                position: "absolute",
                top: 100,
                width: "100%",
                zIndex: 10000,
              }}
            >
              <Container>
                <Alerts
                  style={{
                    flex: 1,
                    width: "100%",
                    height: "100%",
                    alignItems: "flex-end",
                  }}
                />
              </Container>
            </View>
            <Slot />
          </Background>
          <StatusBar style="auto" />
        </Alerts.Provider>
      </Dialog.Provider>
    </ThemeProvider>
  );
}
