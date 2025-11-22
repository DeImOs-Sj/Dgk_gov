import prompts from "prompts";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";
import { clients, tokens } from "../database/sqlite";
import { configDatabase, configEnv } from "../helpers";

const INTERNAL_CLIENT_ID = "00000000-0000-0000-0000-000000000000";

configEnv();

(async () => {
  try {
    const { scope, expiresAt } = await prompts([
      {
        type: "list",
        name: "scope",
        message: "Scope (space-separated)",
        separator: " ",
        validate: (value) => value.length > 0 || "Scope is required",
      },
      {
        type: "number",
        name: "expiresAt",
        message: "Expiration (in seconds)",
        min: 0,
        initial: 3600,
        format: (exp) => Math.floor(Date.now() / 1000) + parseInt(exp),
      },
    ]);

    const db = configDatabase();

    const internalClientExists = await db
      .select({ id: clients.client_id })
      .from(clients)
      .where(eq(clients.client_id, INTERNAL_CLIENT_ID))
      .then((r) => r.length > 0);

    if (!internalClientExists)
      await db.insert(clients).values({
        client_id: INTERNAL_CLIENT_ID,
        client_info: JSON.stringify({
          redirect_uris: [process.env.EXPO_PUBLIC_APP_URL + "/login"],
          client_name: "Internal Client",
        }),
      });

    const token = uuidv4();
    await db.insert(tokens).values({
      client_id: INTERNAL_CLIENT_ID,
      expires_at: expiresAt,
      token,
      scope: scope.join(" "),
      extra: JSON.stringify({
        type: "access",
      }),
    });

    console.log("Access token created successfully:");
    console.log(token);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
