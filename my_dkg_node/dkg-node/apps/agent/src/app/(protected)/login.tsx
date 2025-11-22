import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useCallback } from "react";
import { View } from "react-native";
import * as Linking from "expo-linking";
import * as SplashScreen from "expo-splash-screen";
import { fetch } from "expo/fetch";

import { clientUri, useMcpClient } from "@/client";
import { AuthError, login } from "@/shared/auth";
import Page from "@/components/layout/Page";
import Container from "@/components/layout/Container";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FormTitle from "@/components/forms/FormTitle";
import LoginForm from "@/components/forms/LoginForm";

const getErrorMessage = (err: any) => {
  if (!(err instanceof AuthError)) return "Unknown error occurred!";
  switch (err.code) {
    case AuthError.Code.INVALID_CREDENTIALS:
      return "Invalid username or password";
    case AuthError.Code.NO_REDIRECT_URL:
      return "No redirect URL provided";
    case AuthError.Code.INTERNAL_ERROR:
      return "Internal server error";
    default:
      return "Unknown auth error occurred!";
  }
};

export default function Login() {
  SplashScreen.hide();
  const { code } = useLocalSearchParams<{ code?: string }>();

  const tryLogin = useCallback(
    async ({
      email,
      password,
      rememberMe,
    }: {
      email: string;
      password: string;
      rememberMe: boolean;
    }) => {
      try {
        const url = await login({
          code: code ?? "",
          credentials: { email, password },
          rememberMe,
          fetch: (url, opts) => fetch(url.toString(), opts as any),
        });
        if (url.startsWith(clientUri))
          router.navigate({
            pathname: url.substring(clientUri.length) as any,
          });
        else Linking.openURL(url);
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        throw new Error(errorMessage);
      }
    },
    [code],
  );

  const { connected } = useMcpClient();
  if (connected) return <Redirect href="/" />;

  return (
    <Page>
      <Container>
        <Header mode="login" />
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <View style={{ width: "100%", maxWidth: 450, padding: 15 }}>
            <FormTitle
              title="Login"
              subtitle="Enter your details to get started."
            />
            <LoginForm onSubmit={tryLogin} />
          </View>
        </View>
        <Footer mode="login" />
      </Container>
    </Page>
  );
}
