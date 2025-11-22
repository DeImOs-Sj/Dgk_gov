import { View, Text, ViewStyle, StyleProp } from "react-native";

import useThemeColor from "@/hooks/useThemeColor";

export default function FooterLinks(props: { style?: StyleProp<ViewStyle> }) {
  const placeholderColor = useThemeColor("placeholder");

  return (
    <View
      style={[
        {
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-end",
        },
        props.style,
      ]}
    >
      <Text
        style={{
          color: placeholderColor,
          paddingRight: 8,
          borderRightWidth: 1,
          borderRightColor: placeholderColor,
        }}
      >
        Privacy Policy
      </Text>
      <Text style={{ color: placeholderColor, paddingLeft: 8 }}>
        Terms of Service
      </Text>
    </View>
  );
}
