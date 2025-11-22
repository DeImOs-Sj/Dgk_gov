import { StyleSheet } from "react-native";

const formStyles = StyleSheet.create({
  title: {
    fontSize: 40,
    fontWeight: 700,
    fontFamily: "SpaceGrotesk_700Bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Manrope_400Regular",
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    borderRadius: 50,
    paddingHorizontal: 20,
    paddingVertical: 14,
    height: 45,
    fontSize: 16,
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontFamily: "Manrope_400Regular",
    lineHeight: 24,
    marginBottom: 8,
  },
  errorContainer: {
    marginVertical: 12,
    marginHorizontal: 8,
    height: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
  },
});

export default formStyles;
