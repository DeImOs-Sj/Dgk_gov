import { defineDkgPlugin } from "@dkg/plugins";
import { openAPIRoute, z } from "@dkg/plugin-swagger";

export type AccountManagementProvider = {
  generateCode: (email: string) => Promise<string | null>;
  verifyCode: (code: string) => Promise<{ userId: string } | null>;
  setPassword: (userId: string, newPassword: string) => Promise<void>;
  verifyPassword: (userId: string, currentPassword: string) => Promise<boolean>;
  setInfo: (
    userId: string,
    info: { firstName: string; lastName: string; email: string },
  ) => Promise<void>;
  getInfo: (
    userId: string,
  ) => Promise<{ firstName: string; lastName: string; email: string } | null>;
};

export type AccountManagementPluginConfig = {
  sendMail: (toAddress: string, code: string) => Promise<void>;
  provider: AccountManagementProvider;
};

export default ({ sendMail, provider }: AccountManagementPluginConfig) =>
  defineDkgPlugin((_, mcp, api) => {
    async function sendResetLink(email: string) {
      const code = await provider.generateCode(email).catch(() => null);
      if (!code) return;
      await sendMail(email, code);
    }

    async function resetPassword(code: string, newPassword: string) {
      const result = await provider.verifyCode(code);
      if (!result) throw new Error("Invalid code");
      return provider.setPassword(result.userId, newPassword);
    }

    api.post(
      "/password-reset",
      openAPIRoute(
        {
          tag: "Auth",
          summary: "Send password reset link to an email",
          description:
            "Send a password reset link to the provided email address. " +
            "If there is no user with the provided email address route will fail silently (status 200)",
          body: z.object({
            email: z.string(),
          }),
        },
        (req, res) => {
          sendResetLink(req.body.email)
            .then(() => res.status(200).json({ error: null }))
            .catch((err) =>
              res.status(500).json({ error: `${err?.message || err}` }),
            );
        },
      ),
    );

    mcp.registerTool(
      "password-reset",
      {
        title: "Request a DKG node account password reset",
        description: "Send a password reset link to the provided email address",
      },
      async (req) => {
        const userId = req.authInfo?.extra?.userId;
        if (typeof userId !== "string" || !userId) {
          throw new Error("No user ID found.");
        }
        const userInfo = await provider.getInfo(userId);
        if (!userInfo?.email) {
          throw new Error("No email found for user");
        }
        await sendResetLink(userInfo.email);
        return {
          content: [
            { type: "text", text: "Password reset link sent successfully" },
          ],
        };
      },
    );

    api.post(
      "/password-reset/confirm",
      openAPIRoute(
        {
          tag: "Auth",
          summary: "Reset password using code from email",
          description:
            "Sets a new password for the user. " +
            "Fails if the code is invalid or expired.",
          body: z.object({
            code: z.string(),
            newPassword: z.string(),
          }),
        },
        (req, res) => {
          resetPassword(req.body.code, req.body.newPassword)
            .then(() => res.status(200).json({ error: null }))
            .catch((err) =>
              res.status(400).json({ error: `${err?.message || err}` }),
            );
        },
      ),
    );

    api.post(
      "/change-password",
      openAPIRoute(
        {
          tag: "Auth",
          summary: "Change password",
          description:
            "Changes the password for the user. " +
            "Fails if the old password is incorrect.",
          body: z.object({
            currentPassword: z.string(),
            newPassword: z.string(),
          }),
        },
        async (req, res) => {
          const { currentPassword, newPassword } = req.body;
          const userId = res.locals.auth?.extra?.userId;
          if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
          }

          provider
            .verifyPassword(userId, currentPassword)
            .then((valid) => {
              if (!valid) throw new Error("Wrong password.");
              return provider.setPassword(userId, newPassword);
            })
            .then(() => res.status(200).json({ error: null }))
            .catch((err) =>
              res.status(500).json({ error: `${err?.message || err}` }),
            );
        },
      ),
    );

    api.get(
      "/profile",
      openAPIRoute(
        {
          tag: "Auth",
          summary: "Get user profile",
          description: "Returns the signed-in user's profile data.",
          response: {
            description: "The user's profile data.",
            contentType: "application/json",
            schema: z.object({
              firstName: z.string(),
              lastName: z.string(),
              email: z.string(),
            }),
          },
        },
        async (req, res) => {
          const userId = res.locals.auth?.extra?.userId;
          if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
          }
          const userInfo = await provider.getInfo(userId);
          if (!userInfo) {
            return res.status(404).json({ error: "User not found" });
          }
          return res.status(200).json(userInfo);
        },
      ),
    );

    api.post(
      "/profile",
      openAPIRoute(
        {
          tag: "Auth",
          summary: "Update user profile",
          description: "Updates the signed-in user's profile data.",
          body: z.object({
            firstName: z.string(),
            lastName: z.string(),
            email: z.string().email(),
          }),
        },
        async (req, res) => {
          const userId = res.locals.auth?.extra?.userId;
          if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
          }
          try {
            await provider.setInfo(userId, req.body);
            return res.status(200).send();
          } catch (error) {
            console.error(error);
            if ((error as any)?.code === "SQLITE_CONSTRAINT_UNIQUE") {
              return res
                .status(409)
                .json({ error: "Please use a different email address" });
            }
            return res.status(500).json({ error: "Internal Server Error" });
          }
        },
      ),
    );

    mcp.registerTool(
      "update-profile",
      {
        title: "Update signed-in user's profile",
        description:
          "Allows the signed-in user to update their profile information like their name and email address.",
        inputSchema: {
          firstName: z.string().max(255),
          lastName: z.string().max(255),
          email: z.string().email().max(255),
        },
      },
      async (params, req) => {
        const userId = req.authInfo?.extra?.userId;
        if (typeof userId !== "string" || !userId) {
          throw new Error("No user ID found.");
        }
        await provider.setInfo(userId, params);
        return {
          content: [
            {
              type: "text",
              text: "User profile updated successfully.",
            },
          ],
        };
      },
    );
  });
