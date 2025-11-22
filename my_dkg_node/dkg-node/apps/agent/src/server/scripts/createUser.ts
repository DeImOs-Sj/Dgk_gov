import prompts from "prompts";
import { z } from "zod";
import { configDatabase, configEnv, createUser } from "../helpers";

configEnv();

(async () => {
  try {
    const db = configDatabase();
    const args = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
    const argOrder = ["email", "password", "scope", "firstName", "lastName"];
    prompts.override(
      Object.fromEntries(
        argOrder.map((key, i) => [
          key,
          key === "scope" ? args[i]?.split(",") : args[i],
        ]),
      ),
    );
    const { email, password, scope, firstName, lastName } = await prompts([
      {
        type: "text",
        name: "email",
        message: "Email:",
        validate: (value) =>
          z.string().email().safeParse(value).success ||
          "Please enter a valid email",
      },
      {
        type: "password",
        name: "password",
        message: "Password:",
        validate: (value) => value.length > 0 || "Password is required",
      },
      {
        type: "list",
        name: "scope",
        message: "Scope (space-separated):",
        separator: " ",
        validate: (value) => value.length > 0 || "Scope is required",
      },
      {
        type: "text",
        name: "firstName",
        message: "First name (optional):",
      },
      {
        type: "text",
        name: "lastName",
        message: "Last name (optional):",
      },
    ]);
    const user = await createUser(db, { email, password }, scope, {
      firstName,
      lastName,
    });

    console.log(`User '${user.email}' created successfully with id ${user.id}`);
    process.exit(0);
  } catch (error) {
    console.error("An error occurred:", error);
    process.exit(1);
  }
})();
