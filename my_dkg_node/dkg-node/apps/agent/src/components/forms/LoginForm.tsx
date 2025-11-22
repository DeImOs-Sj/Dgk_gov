import { useCallback, useState } from "react";
import { StyleProp, Text, TextInput, View, ViewStyle } from "react-native";
import { Link } from "expo-router";

import useColors from "@/hooks/useColors";
import Button from "@/components/Button";
import Checkbox from "@/components/Checkbox";
import { toError } from "@/shared/errors";

import formStyles from "./formStyles";

export default function LoginForm({
  onSubmit,
  style,
}: {
  onSubmit: (data: {
    email: string;
    password: string;
    rememberMe: boolean;
  }) => Promise<void>;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useColors();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const disabled = !email || !password || loading;

  const submit = useCallback(async () => {
    if (disabled) return;
    setError("");
    setLoading(true);
    try {
      await onSubmit({ email, password, rememberMe });
      setEmail("");
      setPassword("");
      setError("");
    } catch (error) {
      setError(toError(error).message);
    }
    setLoading(false);
  }, [disabled, email, password, rememberMe, onSubmit]);

  return (
    <View style={style}>
      <TextInput
        style={[
          formStyles.input,
          { backgroundColor: colors.input, color: colors.text },
        ]}
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor={colors.placeholder}
        keyboardType="email-address"
        textContentType="emailAddress"
        autoCapitalize="none"
        testID="login-email-input"
        onKeyPress={({ nativeEvent }) => {
          if (nativeEvent.key === "Enter") {
            if (!disabled) submit();
          }
        }}
      />
      <TextInput
        style={[
          formStyles.input,
          { backgroundColor: colors.input, color: colors.text },
        ]}
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor={colors.placeholder}
        secureTextEntry
        testID="login-password-input"
        onKeyPress={({ nativeEvent }) => {
          if (nativeEvent.key === "Enter") {
            if (!disabled) submit();
          }
        }}
      />
      <Checkbox
        value={rememberMe}
        onValueChange={setRememberMe}
        style={{ marginBottom: 16 }}
      >
        <Text
          style={{
            color: colors.placeholder,
            fontFamily: "Manrope_400Regular",
            marginLeft: 8,
          }}
        >
          Remember me
        </Text>
      </Checkbox>

      <Button
        color="primary"
        text="Login"
        onPress={submit}
        disabled={disabled}
        testID="login-submit-button"
      />
      <Link
        href="/password-reset"
        style={{
          color: colors.secondary,
          fontSize: 16,
          fontFamily: "Manrope_600SemiBold",
          textAlign: "center",
          marginVertical: 16,
        }}
      >
        Forgot password?
      </Link>

      <View
        style={[
          formStyles.errorContainer,
          { visibility: error ? "visible" : "hidden" },
        ]}
      >
        <Text style={[formStyles.errorText, { color: colors.error }]}>
          {error}
        </Text>
      </View>
    </View>
  );
}
