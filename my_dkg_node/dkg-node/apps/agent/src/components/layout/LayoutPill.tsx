import { View, ViewProps } from "react-native";

import useThemeColor from "@/hooks/useThemeColor";

export default function LayoutPill({ children, style, ...props }: ViewProps) {
  const cardColor = useThemeColor("card");

  return (
    <View
      style={{
        width: "100%",
        display: "flex",
      }}
    >
      <View
        style={[
          {
            height: 80,
            width: "100%",
            borderRadius: 40,
            backgroundColor: cardColor,
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
          },
          style,
        ]}
      >
        {children}
      </View>
    </View>
  );
}
