import { useColorScheme } from "./useColorScheme";
import { Colors } from "./useColors";

export default function useThemeColor(
  color:
    | { light: string; dark: string }
    | (keyof typeof Colors.light & keyof typeof Colors.dark),
) {
  const theme = useColorScheme() ?? "light";
  return typeof color === "string" ? Colors[theme][color] : color[theme];
}
