import Svg, { Path } from "react-native-svg";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { Color } from "@/hooks/useColors";
import useThemeColor from "@/hooks/useThemeColor";
import { useEffect } from "react";

export default function Spinner({
  size,
  width = 1.6,
  color = "primary",
  speed = 1000,
}: {
  size: number;
  width?: number;
  color?: Color;
  speed?: number;
}) {
  const strokeColor = useThemeColor(color);
  const rotation = useSharedValue(0);
  useEffect(() => {
    rotation.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 0, easing: Easing.linear }),
        withTiming(360, { duration: speed, easing: Easing.linear }),
      ),
      -1,
    );
  }, [rotation, speed]);
  const style = useAnimatedStyle(
    () => ({
      height: size,
      width: size,
      transform: [{ rotateZ: `${rotation.value}deg` }],
    }),
    [size, rotation],
  );

  return (
    <Animated.View style={style}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          stroke={strokeColor}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={width}
          d="M5.636 5.636A9 9 0 1 0 21 12"
        />
      </Svg>
    </Animated.View>
  );
}
