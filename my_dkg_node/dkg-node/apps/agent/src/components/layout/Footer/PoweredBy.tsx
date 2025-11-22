import { StyleProp, Text, View, ViewStyle } from "react-native";

import useThemeColor from "@/hooks/useThemeColor";
import OriginTrailLogo from "../../OriginTrailLogo";

export default function PoweredBy(props: { style?: StyleProp<ViewStyle> }) {
  const secondaryColor = useThemeColor("secondary");

  return (
    <View
      style={[
        {
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
        },
        props.style,
      ]}
    >
      <Text style={{ color: secondaryColor, marginRight: 8 }}>Powered by</Text>
      <OriginTrailLogo fill={secondaryColor} />
    </View>
  );
}
