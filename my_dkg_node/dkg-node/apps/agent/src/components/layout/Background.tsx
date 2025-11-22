import useThemeColor from "@/hooks/useThemeColor";
import { PropsWithChildren } from "react";
import { View, StyleSheet } from "react-native";
import Svg, {
  Defs,
  RadialGradient,
  Stop,
  Rect,
  NumberProp,
} from "react-native-svg";

export default function Background(
  props: PropsWithChildren<{
    gradientWidth?: NumberProp;
    gradientHeight?: NumberProp;
  }>,
) {
  const backgroundColor = useThemeColor("background");

  return (
    <View
      style={{
        width: "100%",
        height: "100%",
        flex: 1,
        zIndex: -1,
        position: "relative",
      }}
    >
      <Svg height="100%" width="100%" style={styles.absoluteFill}>
        <Defs>
          <RadialGradient
            id="radialGradient"
            gradientUnits="objectBoundingBox"
            cx="0"
            cy="0"
            r={1}
          >
            <Stop offset="0" stopColor="#949494" stopOpacity={1} />
            <Stop offset="0.6352" stopColor="#181818" stopOpacity={1} />
            <Stop offset="1" stopColor="#1D1D1D" stopOpacity={1} />
          </RadialGradient>
        </Defs>
        <Rect
          width={props.gradientWidth ?? "100%"}
          height={props.gradientHeight ?? "100%"}
          fill="url(#radialGradient)"
        />
      </Svg>

      <View
        style={[styles.absoluteFill, { backgroundColor: backgroundColor }]}
      />

      {props.children}
    </View>
  );
}

const styles = StyleSheet.create({
  absoluteFill: {
    position: "absolute",
    width: "100%",
    height: "100%",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
