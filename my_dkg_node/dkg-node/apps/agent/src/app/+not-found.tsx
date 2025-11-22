import { Link } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StyleSheet, Text, View } from "react-native";

import useColors from "@/hooks/useColors";

export default function NotFoundScreen() {
  SplashScreen.hide();
  const colors = useColors();

  return (
    <>
      <View style={styles.container}>
        <Text
          style={{
            color: colors.text,
            fontFamily: "Manrope_400Regular",
            fontSize: 32,
            lineHeight: 32,
          }}
        >
          This screen does not exist.
        </Text>
        <Link href="/" style={styles.link}>
          <Text
            style={{
              color: colors.secondary,
              fontFamily: "Manrope_600SemiBold",
              fontWeight: "600",
              fontSize: 16,
              lineHeight: 30,
            }}
          >
            Go to home screen!
          </Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
