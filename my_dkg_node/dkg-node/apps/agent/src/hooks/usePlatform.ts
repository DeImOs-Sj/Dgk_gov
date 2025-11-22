import { Platform, useWindowDimensions } from "react-native";

export default function usePlatform() {
  const { width, height, fontScale, scale } = useWindowDimensions();

  const size = {
    w: {
      sm: width < 600,
      md: width >= 600,
      lg: width >= 1024,
      xl: width >= 1440,
    },
    h: {
      sm: height < 600,
      md: height >= 600,
      lg: height >= 1024,
      xl: height >= 1440,
    },
    get sm() {
      return this.w.sm && this.h.sm;
    },
    get md() {
      return this.w.md && this.h.md;
    },
    get lg() {
      return this.w.lg && this.h.lg;
    },
    get xl() {
      return this.w.xl && this.h.xl;
    },
  };

  return {
    width,
    height,
    fontScale,
    scale,
    isNativeMobile: Platform.OS === "ios" || Platform.OS === "android",
    isWeb: Platform.OS === "web",
    isNativeDesktop: Platform.OS === "macos" || Platform.OS === "windows",
    size,
  };
}
