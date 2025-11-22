import { useEffect, useState } from "react";
import {
  ColorSchemeName,
  useColorScheme as useRNColorScheme,
} from "react-native";

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);
  const rnColorScheme = useRNColorScheme();
  const [prefColorScheme, setPrefColorScheme] =
    useState<ColorSchemeName>(rnColorScheme);

  useEffect(() => {
    setHasHydrated(true);
    const pref = window.matchMedia("(prefers-color-scheme: dark)");
    const handlePrefChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setPrefColorScheme("dark");
      } else {
        setPrefColorScheme("light");
      }
    };
    pref.addEventListener("change", handlePrefChange);
    return () => {
      pref.removeEventListener("change", handlePrefChange);
    };
  }, []);

  if (hasHydrated) {
    return prefColorScheme;
  }

  return "dark";
}
