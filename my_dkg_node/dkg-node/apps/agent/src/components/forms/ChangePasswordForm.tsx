import { useCallback, useState } from "react";
import { Text, TextInput, View, ViewStyle, StyleProp } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

import Button from "@/components/Button";
import useColors from "@/hooks/useColors";
import { toError } from "@/shared/errors";

import formStyles from "./formStyles";

const passwordChecks = [
  { regex: /.{8,}/, message: "Minimum 8 characters" },
  { regex: /[A-Z]/, message: "One uppercase letter" },
  { regex: /[a-z]/, message: "One lowercase letter" },
  {
    regex: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
    message: "One special character",
  },
  { regex: /[0-9]/, message: "One number" },
];

enum ChangePasswordFormMode {
  CODE = "CODE",
  PASSWORD = "PASSWORD",
}

export default function ChangePasswordForm<M extends ChangePasswordFormMode>({
  mode,
  onSubmit,
  cardBackground,
  showLabels,
  style,
}: {
  mode: M;
  onSubmit: M extends ChangePasswordFormMode.CODE
    ? (data: { newPassword: string }) => Promise<void>
    : (data: { newPassword: string; currentPassword: string }) => Promise<void>;
  cardBackground?: boolean;
  showLabels?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useColors();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const passwordsMatch = newPassword === confirmNewPassword;
  const validPassword =
    !!newPassword &&
    passwordChecks.every((check) => check.regex.test(newPassword));
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const passwordChecksStyle = useAnimatedStyle(
    () => ({
      height: withTiming(!newPassword || validPassword ? 0 : 115, {
        duration: 500,
      }),
      overflow: "hidden",
    }),
    [newPassword, validPassword],
  );

  const submit = useCallback(async () => {
    setError("");
    if (!passwordsMatch) {
      setError("Passwords do not match");
      return;
    }
    if (!validPassword) {
      setError("Password does not meet requirements");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({ newPassword, currentPassword });
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error) {
      setError(toError(error).message);
    }
    setLoading(false);
  }, [onSubmit, currentPassword, newPassword, passwordsMatch, validPassword]);

  return (
    <View style={style}>
      {mode === ChangePasswordFormMode.PASSWORD && (
        <>
          {showLabels && (
            <Text style={[formStyles.label, { color: colors.placeholder }]}>
              Current password
            </Text>
          )}
          <TextInput
            style={[
              formStyles.input,
              cardBackground
                ? {
                    backgroundColor: colors.card2,
                    color: colors.text,
                  }
                : {
                    backgroundColor: colors.input,
                    color: colors.text,
                  },
            ]}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Current password"
            placeholderTextColor={colors.placeholder}
            secureTextEntry
          />
        </>
      )}
      {showLabels && (
        <Text style={[formStyles.label, { color: colors.placeholder }]}>
          New password
        </Text>
      )}
      <TextInput
        style={[
          formStyles.input,
          cardBackground
            ? {
                backgroundColor: colors.card2,
                color: colors.text,
              }
            : {
                backgroundColor: colors.input,
                color: colors.text,
              },
        ]}
        value={newPassword}
        onChangeText={setNewPassword}
        placeholder="New password"
        placeholderTextColor={colors.placeholder}
        secureTextEntry
      />
      <Animated.View style={passwordChecksStyle}>
        <Text
          style={{
            color: colors.placeholder,
            fontFamily: "Manrope_400Regular",
            fontSize: 12,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Text>
            Please add all necessary characters to create safe password.
          </Text>
          {passwordChecks.map((check, index) => (
            <Text
              key={index}
              style={[
                { color: colors.secondary },
                check.regex.test(newPassword) && {
                  color: colors.placeholder,
                },
              ]}
            >
              • {check.message}
            </Text>
          ))}
        </Text>
      </Animated.View>
      {showLabels && (
        <Text style={[formStyles.label, { color: colors.placeholder }]}>
          Confirm new password
        </Text>
      )}
      <TextInput
        style={[
          formStyles.input,
          cardBackground
            ? {
                backgroundColor: colors.card2,
                color: colors.text,
              }
            : {
                backgroundColor: colors.input,
                color: colors.text,
              },
        ]}
        value={confirmNewPassword}
        onChangeText={setConfirmNewPassword}
        placeholder="Confirm new password"
        placeholderTextColor={colors.placeholder}
        secureTextEntry
      />
      <Button
        color="primary"
        text="Change password"
        onPress={submit}
        disabled={!validPassword || loading}
      />
      {error && (
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
      )}
    </View>
  );
}

ChangePasswordForm.Mode = ChangePasswordFormMode;
