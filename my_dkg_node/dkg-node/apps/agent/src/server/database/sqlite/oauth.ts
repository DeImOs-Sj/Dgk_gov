import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const clients = sqliteTable("oauth_clients", {
  client_id: text().primaryKey(),
  client_info: text().notNull(),
});

export const codes = sqliteTable("oauth_codes", {
  code: text().primaryKey(),
  client_id: text()
    .notNull()
    .references(() => clients.client_id),
  client_info: text().notNull(),
  params: text().notNull(),
  confirmed: text().default(""),
});

export const tokens = sqliteTable("oauth_tokens", {
  token: text().primaryKey(),
  client_id: text()
    .notNull()
    .references(() => clients.client_id),
  expires_at: integer().notNull(),
  scope: text().notNull(),
  resource: text(),
  extra: text(),
});
