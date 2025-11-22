import {
  StyleProp,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

import useColors from "@/hooks/useColors";
import KAIcon from "@/components/icons/KAIcon";

export default function ChatMessageSourceKAsChip({
  title,
  issuer,
  onPress,
  style,
}: {
  title: string;
  issuer: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.card,
          borderRadius: 16,
          height: 64,
          padding: 8,
          gap: 8,
        },
        style,
      ]}
    >
      <KAIcon
        height={48}
        width={48}
        fill={colors.secondary}
        stroke={colors.secondary}
      />
      <View>
        <Text
          style={{
            color: colors.text,
            fontFamily: "Manrope_500Medium",
            fontSize: 14,
            lineHeight: 16,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            color: colors.text,
            fontFamily: "Manrope_400Regular",
            fontSize: 12,
            lineHeight: 16,
          }}
        >
          Issuer:{" "}
          <Text
            style={{
              color: colors.secondary,
              fontFamily: "Manrope_500Medium",
              fontSize: 12,
              lineHeight: 16,
            }}
          >
            {issuer}
          </Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
}
