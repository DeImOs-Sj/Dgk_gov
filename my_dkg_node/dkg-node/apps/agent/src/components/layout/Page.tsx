import { View, ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Page({ style, children, ...props }: ViewProps) {
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <View
      style={[
        {
          flex: 1,
          marginTop: safeAreaInsets.top,
          marginBottom: safeAreaInsets.bottom,
          marginLeft: safeAreaInsets.left,
          marginRight: safeAreaInsets.right,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
