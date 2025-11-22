import { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import useColors from "@/hooks/useColors";
import Button from "@/components/Button";
import Checkbox from "@/components/Checkbox";
import { Collapsible } from "react-native-fast-collapsible";
import Spinner from "@/components/Spinner";

export default function ChatMessageToolCall({
  title,
  description,
  status,
  input,
  output,
  autoconfirm,
  onConfirm,
  onCancel,
}: {
  title: string;
  description?: string;
  status?: "init" | "loading" | "success" | "error" | "cancelled";
  input?: unknown;
  output?: unknown;
  autoconfirm?: boolean;
  onConfirm: (allowForSession: boolean) => void;
  onCancel: () => void;
}) {
  const colors = useColors();
  const [seeMore, setSeeMore] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const [allowForSession, setAllowForSession] = useState(false);

  if (!status && autoconfirm) status = "loading";
  if (!status) status = "init";

  useEffect(() => {
    if (autoconfirm) onConfirm(true);
  }, [autoconfirm, onConfirm]);

  if (status === "init")
    return (
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.description, { color: colors.text }]}>
          {description}
        </Text>

        {/*<Text>{JSON.stringify(tc.args, null, 2)}</Text>*/}

        {!!input && (
          <View>
            <TouchableOpacity onPress={() => setSeeMore(!seeMore)}>
              <Text style={[styles.link, { color: colors.secondary }]}>
                {seeMore ? "Hide input" : "See input"}
              </Text>
            </TouchableOpacity>
            <Collapsible isVisible={seeMore}>
              <Text style={[styles.codeText, { color: colors.text }]}>
                {JSON.stringify(input, null, 2)}
              </Text>
            </Collapsible>
          </View>
        )}
        <View />
        {status === "init" && (
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <Button
              color="primary"
              text="Continue"
              onPress={() => onConfirm(allowForSession)}
              testID="tool-continue-button"
            />
            <Button color="card" text="Cancel" onPress={onCancel} />
            <Checkbox
              value={allowForSession}
              onValueChange={setAllowForSession}
              testID="tool-allow-session-checkbox"
            >
              <Text style={{ color: colors.secondary }}>
                Allow tool for this session
              </Text>
            </Checkbox>
          </View>
        )}
      </View>
    );

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <TouchableOpacity
        onPress={() => setCollapsed((c) => !c)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Ionicons
          name={collapsed ? "chevron-forward-outline" : "chevron-down-outline"}
          size={20}
          style={{ marginRight: 4 }}
          color={colors.text}
        />
        <Text style={[styles.title, { flex: 1, color: colors.text }]}>
          {title}
        </Text>
        {status !== "loading" && (
          <Ionicons
            name={status === "success" ? "checkmark" : "close"}
            size={20}
            style={{ marginLeft: 4 }}
            color={status === "error" ? colors.error : colors.secondary}
          />
        )}
      </TouchableOpacity>

      {!collapsed && (
        <View style={{ paddingHorizontal: 24, paddingTop: 8, gap: 8 }}>
          <Text style={[styles.title, { color: colors.text }]}>Input</Text>
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>
              {JSON.stringify(input, null, 2)}
            </Text>
          </View>
          {status !== "loading" && (
            <>
              <Text style={[styles.title, { color: colors.text }]}>Output</Text>
              <View style={styles.codeBlock}>
                {status === "success" && (
                  <Text style={styles.codeText}>
                    {JSON.stringify(output, null, 2)}
                  </Text>
                )}
                {status === "error" && (
                  <Text style={[styles.codeText, { color: colors.error }]}>
                    {`${output}`}
                  </Text>
                )}
                {status === "cancelled" && (
                  <Text style={[styles.codeText, { color: colors.secondary }]}>
                    Tool call was cancelled by user.
                  </Text>
                )}
              </View>
            </>
          )}
        </View>
      )}
      {status === "loading" && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Spinner size={20} color="secondary" />
          <Text
            style={{ fontFamily: "Manrope_400Regular", color: colors.text }}
          >
            Running tool...
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  title: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
  },
  description: {
    fontFamily: "Manrope_400Regular",
    fontSize: 12,
  },
  codeBlock: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#0c0c0c33",
    width: "100%",
    maxHeight: 120,
    overflow: "scroll",
  },
  codeText: {
    fontFamily: "monospace",
    fontSize: 11,
    color: "#ffffff",
  },
  link: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    color: "#ffffff",
    textDecorationLine: "underline",
  },
});
