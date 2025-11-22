import { useCallback, useState } from "react";
import { StyleProp, TextInput, View, ViewStyle } from "react-native";

import Button from "@/components/Button";
import useColors from "@/hooks/useColors";

import formStyles from "./formStyles";

export default function RequestPasswordResetForm({
  onSubmit,
  style,
}: {
  onSubmit: (data: { email: string }) => Promise<void>;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useColors();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = useCallback(async () => {
    setLoading(true);
    try {
      await onSubmit({ email });
      setEmail("");
    } finally {
      setLoading(false);
    }
  }, [onSubmit, email]);

  return (
    <View style={style}>
      <TextInput
        style={[
          formStyles.input,
          { backgroundColor: colors.input, color: colors.text },
        ]}
        value={email}
        onChangeText={setEmail}
        placeholder="Enter your email address"
        placeholderTextColor={colors.placeholder}
        keyboardType="email-address"
        textContentType="emailAddress"
        autoCapitalize="none"
      />
      <View style={{ height: 16 }} />
      <Button
        color="primary"
        text="Send reset link"
        onPress={submit}
        disabled={!email || loading}
      />
    </View>
  );
}
