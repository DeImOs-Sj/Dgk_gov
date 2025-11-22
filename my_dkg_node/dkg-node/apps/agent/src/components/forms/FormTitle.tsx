import { StyleProp, View, ViewStyle, Text } from "react-native";

import useColors from "@/hooks/useColors";

import formStyles from "./formStyles";

export default function FormTitle({
  title,
  subtitle,
  style,
}: {
  title: string;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useColors();

  return (
    <View style={[{ width: "100%" }, style]}>
      <Text style={[formStyles.title, { color: colors.secondary }]}>
        {title}
      </Text>
      {subtitle && (
        <Text style={[formStyles.subtitle, { color: colors.text }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}
