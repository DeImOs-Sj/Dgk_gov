import { Text, TouchableOpacity, View, ViewProps } from "react-native";

import useColors from "@/hooks/useColors";
import KAIcon from "@/components/icons/KAIcon";

export default function ChatMessageSourceKAsMoreChip({
  moreNumber,
  zeroVisible,
  onPress,
  style,
  ...props
}: ViewProps & {
  moreNumber: number;
  zeroVisible: boolean;
  onPress?: () => void;
}) {
  const colors = useColors();

  return (
    <TouchableOpacity
      {...props}
      onPress={onPress}
      style={[
        {
          backgroundColor: colors.card,
          padding: 12,
          borderRadius: 16,
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          gap: 8,
        },
        style,
      ]}
    >
      {!zeroVisible ? (
        <Text
          style={{
            color: colors.secondary,
            fontFamily: "Manrope_400Regular",
          }}
        >
          {`+ ${moreNumber} more`}
        </Text>
      ) : (
        <>
          <KAIcon
            width={36}
            height={36}
            fill={colors.secondary}
            stroke={colors.secondary}
          />
          <View>
            <Text
              style={{
                color: colors.secondary,
                fontFamily: "Manrope_400Regular",
              }}
            >
              {moreNumber} Knowledge Assets
            </Text>
            <Text
              style={{
                color: colors.text,
                fontFamily: "Manrope_400Regular",
                fontSize: 11,
              }}
            >
              See more
            </Text>
          </View>
        </>
      )}
    </TouchableOpacity>
  );
}
