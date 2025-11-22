import { View, Text, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import Ionicons from "@expo/vector-icons/Ionicons";

import useColors from "@/hooks/useColors";
import { FileDefinition } from "@/shared/files";

export default function ChatInputAttachmentChip({
  file: { mimeType, name, uri },
  authToken,
  onPress,
  onRemove,
}: {
  file: FileDefinition;
  authToken?: string;
  onPress?: () => void;
  onRemove?: () => void;
}) {
  const colors = useColors();

  let ext = "unknown";
  let isImage = false;

  switch (mimeType) {
    case "image/jpg":
    case "image/jpeg":
      ext = "JPEG";
      isImage = true;
      break;
    case "image/png":
      ext = "PNG";
      isImage = true;
      break;
    case "image/svg+xml":
      ext = "SVG";
      isImage = true;
      break;
    case "application/pdf":
      ext = "PDF";
      break;
    default:
      ext = "unknown";
      break;
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 12,
        gap: 8,
        marginRight: 8,
      }}
    >
      {isImage ? (
        <Image
          source={
            authToken
              ? { uri, headers: { Authorization: `Bearer ${authToken}` } }
              : { uri }
          }
          style={{ width: 40, height: 40 }}
          contentFit="cover"
        />
      ) : (
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            backgroundColor: "#0c0c0c33",
          }}
        >
          <Ionicons
            name="document-text-outline"
            size={24}
            color={colors.secondary}
            style={{ padding: 8 }}
          />
        </View>
      )}
      <View>
        <Text
          style={{
            color: colors.text,
            fontFamily: "Manrope_600SemiBold",
            fontSize: 16,
            lineHeight: 24,
          }}
        >
          {name}
        </Text>
        <Text
          style={{
            color: colors.text,
            fontFamily: "Manrope_400Regular",
            fontSize: 16,
            lineHeight: 24,
          }}
        >
          {ext}
        </Text>
      </View>
      {onRemove && (
        <View style={{ justifyContent: "center", alignItems: "center" }}>
          <Ionicons
            name="close"
            size={24}
            color={colors.secondary}
            onPress={onRemove}
          />
        </View>
      )}
    </TouchableOpacity>
  );
}
