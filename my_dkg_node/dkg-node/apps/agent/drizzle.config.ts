import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/server/database/sqlite/*",
  out: "./drizzle/sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
