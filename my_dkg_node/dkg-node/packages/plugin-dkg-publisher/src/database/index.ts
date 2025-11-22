import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { migrate } from "drizzle-orm/mysql2/migrator";
import * as schema from "./schema";
import path from "path";

export type Database = ReturnType<typeof createDatabase>;

export function createDatabase(connectionString: string) {
  const pool = mysql.createPool(connectionString);
  return drizzle(pool, { schema, mode: "default" });
}

export async function runMigrations(db: Database) {
  await migrate(db, {
    migrationsFolder: path.join(__dirname, "./migrations"),
  });
}

export * from "./schema";
