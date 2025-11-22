import { Text } from "react-native";

export default function GraphView(props: {
  ual: string;
  assertion: Record<string, any>[];
}) {
  return (
    <Text
      style={{
        color: "#dcdcdc",
        fontFamily: "Manrope_600SemiBold",
        fontSize: 16,
      }}
    >
      Coming soon...
    </Text>
  );
}
