import { useCallback, useEffect, useState } from "react";
import { Text, TextInput, View } from "react-native";

import { toError } from "@/shared/errors";
import useColors from "@/hooks/useColors";
import Button from "@/components/Button";

import formStyles from "./formStyles";

export default function ProfileDetailsForm({
  user,
  onSubmit,
}: {
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  onSubmit: (data: {
    firstName: string;
    lastName: string;
    email: string;
  }) => Promise<void>;
}) {
  const colors = useColors();
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!user);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setEmail(user.email);
      setLoading(false);
    }
  }, [user]);

  const submit = useCallback(async () => {
    setError("");

    setLoading(true);
    try {
      await onSubmit({ firstName, lastName, email });
    } catch (error) {
      setError(toError(error).message);
    }
    setLoading(false);
  }, [onSubmit, firstName, lastName, email]);

  const isDirty =
    firstName !== user?.firstName ||
    lastName !== user?.lastName ||
    email !== user?.email;

  return (
    <View>
      <Text style={[formStyles.label, { color: colors.placeholder }]}>
        First name
      </Text>
      <TextInput
        style={[
          formStyles.input,
          {
            backgroundColor: colors.card2,
            color: colors.text,
          },
        ]}
        value={firstName}
        onChangeText={setFirstName}
        placeholder="First name"
        placeholderTextColor={colors.placeholder}
      />
      <Text style={[formStyles.label, { color: colors.placeholder }]}>
        Last name
      </Text>
      <TextInput
        style={[
          formStyles.input,
          {
            backgroundColor: colors.card2,
            color: colors.text,
          },
        ]}
        value={lastName}
        onChangeText={setLastName}
        placeholder="Last name"
        placeholderTextColor={colors.placeholder}
      />
      <Text style={[formStyles.label, { color: colors.placeholder }]}>
        Email
      </Text>
      <TextInput
        style={[
          formStyles.input,
          {
            backgroundColor: colors.card2,
            color: colors.text,
          },
        ]}
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor={colors.placeholder}
        keyboardType="email-address"
      />
      <Button
        color="primary"
        text="Save"
        onPress={submit}
        disabled={!isDirty || loading}
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
