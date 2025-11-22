import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { v7 as uuid_v7 } from "uuid";

export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .notNull()
    .$default(() => uuid_v7()),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  scope: text("scope").notNull(),
  firstName: text("first_name").notNull().default(""),
  lastName: text("last_name").notNull().default(""),
});

export const passwordResets = sqliteTable("password_resets", {
  id: integer("id").primaryKey({ autoIncrement: true }).notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  code: text("code").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});
