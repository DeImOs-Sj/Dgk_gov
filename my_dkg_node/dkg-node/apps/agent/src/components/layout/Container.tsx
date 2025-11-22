import { View, ViewProps } from "react-native";

export default function Container({ style, children, ...props }: ViewProps) {
  return (
    <View
      style={[
        {
          flex: 1,
          width: "100%",
          maxWidth: 1200,
          marginHorizontal: "auto",
          padding: 20,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
