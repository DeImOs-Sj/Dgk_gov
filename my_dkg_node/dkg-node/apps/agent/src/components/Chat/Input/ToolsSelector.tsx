import { View, Text, ScrollView, StyleSheet } from "react-native";

import useColors from "@/hooks/useColors";
import Checkbox from "@/components/Checkbox";

export default function ChatInputToolsSelector({
  tools = {},
  onToolTick,
  onToolServerTick,
}: {
  tools?: Record<
    string,
    { name: string; description?: string; enabled?: boolean }[]
  >;
  onToolTick?: (mcpServer: string, toolName: string, value: boolean) => void;
  onToolServerTick?: (mcpServer: string, value: boolean) => void;
}) {
  const colors = useColors();

  return (
    <View
      style={{
        maxWidth: 530,
        maxHeight: 220,
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 8,
      }}
    >
      {!Object.keys(tools).length && (
        <Text style={[{ color: colors.placeholder, padding: 8 }]}>
          No tools provided.
        </Text>
      )}
      <ScrollView>
        {Object.keys(tools).map((mcpServer) => (
          <View key={mcpServer}>
            <Checkbox
              value={tools[mcpServer]!.some((t) => t.enabled)}
              onValueChange={(val) => {
                onToolServerTick?.(mcpServer, val);
              }}
            >
              <Text style={[styles.toolTitle, { color: colors.text }]}>
                MCP Server: {mcpServer}
              </Text>
            </Checkbox>
            {tools[mcpServer]!.map((tool) => (
              <Checkbox
                key={tool.name}
                value={tool.enabled}
                onValueChange={(val) => {
                  onToolTick?.(mcpServer, tool.name, val);
                }}
                style={{ paddingLeft: 16 }}
              >
                <Text
                  numberOfLines={1}
                  style={[styles.toolDesc, { color: colors.placeholder }]}
                >
                  <Text style={[styles.toolTitle, { color: colors.text }]}>
                    {tool.name}
                    {tool.description && ":"}
                  </Text>
                  {tool.description}
                </Text>
              </Checkbox>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  toolTitle: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    lineHeight: 21,
    paddingRight: 4,
  },
  toolDesc: {
    fontFamily: "Manrope_400Regular",
    fontSize: 14,
    lineHeight: 21,
  },
});
