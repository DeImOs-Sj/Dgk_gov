import { forwardRef, type ReactNode } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  GestureResponderEvent,
  StyleProp,
  ViewStyle,
  View,
} from "react-native";
import { SvgProps } from "react-native-svg";

import useColors, { Color } from "@/hooks/useColors";

const Button = forwardRef<
  View,
  {
    color: Color;
    flat?: boolean;
    icon?: (props: SvgProps) => ReactNode;
    iconMode?: "fill" | "stroke";
    text?: string;
    disabled?: boolean;
    onPress?: (e: GestureResponderEvent) => void;
    style?: StyleProp<ViewStyle>;
    testID?: string;
  }
>(function Button(props, ref) {
  const { color, flat, text, disabled, onPress, style, testID } = props;
  const colors = useColors();
  const buttonColor = disabled ? "#b8b8b8" : colors[color];

  let textColor: string;
  let backgroundColor: string;

  if (flat) {
    textColor = buttonColor;
    backgroundColor = "transparent";
  } else {
    textColor = colors.getTextColor(color);
    backgroundColor = buttonColor;
  }

  return (
    <TouchableOpacity
      ref={ref}
      style={[
        styles.button,
        { backgroundColor },
        (!flat || !text) && { borderRadius: 50 },
        !flat && { padding: 12 },
        disabled || flat ? styles.buttonShadowDisabled : styles.buttonShadow,
        style,
      ]}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      testID={testID}
    >
      {props.icon && (
        <props.icon
          {...{ [props.iconMode ?? "stroke"]: textColor }}
          height={18}
          width={18}
        />
      )}
      {text && (
        <Text style={[styles.buttonText, { color: textColor }]}>{text}</Text>
      )}
    </TouchableOpacity>
  );
});

export default Button;

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    height: 45,
  },
  buttonShadow: {
    shadowColor: "#3498db",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonShadowDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Manrope_500Medium",
  },
});
