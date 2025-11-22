import { z } from "zod";

import { ErrorWithCode } from "./errors";

export const userCredentialsSchema = z.object({
  email: z.string(),
  password: z.string(),
});

export type UserCredentials = z.infer<typeof userCredentialsSchema>;

export enum AuthErrorCode {
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  NO_REDIRECT_URL = "NO_REDIRECT_URL",
  INTERNAL_ERROR = "INTERNAL_ERROR",
}
export class AuthError extends ErrorWithCode<AuthErrorCode> {
  static Code = AuthErrorCode;
}

export const login = (opts: {
  code: string;
  credentials: UserCredentials;
  rememberMe?: boolean;
  fetch?: typeof fetch;
}) =>
  (opts.fetch ?? fetch)(
    process.env.EXPO_PUBLIC_MCP_URL +
      "/login?" +
      new URLSearchParams({
        code: opts.code,
        includeRefreshToken: opts.rememberMe ? "1" : "0",
      }).toString(),
    {
      method: "POST",
      body: JSON.stringify(opts.credentials),
      headers: {
        "Content-Type": "application/json",
      },
    },
  )
    .then((r) => {
      if (r.status >= 500)
        throw new AuthError(
          "Internal server error",
          AuthErrorCode.INTERNAL_ERROR,
        );
      if (r.status >= 400)
        throw new AuthError(
          "Invalid credentials",
          AuthErrorCode.INVALID_CREDENTIALS,
        );

      return r.json();
    })
    .then((data) => {
      const targetUrl = data?.targetUrl as string;

      if (!targetUrl || typeof targetUrl !== "string")
        throw new AuthError(
          "No redirect URL found",
          AuthErrorCode.NO_REDIRECT_URL,
        );

      return data.targetUrl as string;
    });
