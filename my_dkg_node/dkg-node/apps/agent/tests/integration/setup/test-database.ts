import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "path";
import fs from "fs";
import {
  users,
  SqliteOAuthStorageProvider,
} from "../../../src/server/database/sqlite";
import { hash } from "@node-rs/argon2";

/**
 * Creates a test database with sample users and OAuth storage
 */
export async function createTestDatabase(): Promise<{
  db: ReturnType<typeof drizzle>;
  sqlite: Database.Database;
  oauthStorage: SqliteOAuthStorageProvider;
  testClient: any;
  cleanup: () => void;
}> {
  // Create temporary database file
  const tempDbPath = path.join(process.cwd(), `test-${Date.now()}.db`);

  const sqlite = new Database(tempDbPath);
  const db = drizzle(sqlite);

  // Run migrations to set up schema
  migrate(db, {
    migrationsFolder: path.join(__dirname, "../../../drizzle/sqlite"),
  });

  // Create test users
  const adminPasswordHash = await hash("admin123");
  const userPasswordHash = await hash("userpass");

  await db.insert(users).values([
    {
      email: "admin@example.com",
      password: adminPasswordHash,
      scope: "mcp llm scope123 blob",
    },
    {
      email: "user@example.com",
      password: userPasswordHash,
      scope: "mcp blob",
    },
    {
      email: "limited@example.com",
      password: await hash("limited123"),
      scope: "mcp",
    },
  ]);

  // Create OAuth storage provider
  const oauthStorage = new SqliteOAuthStorageProvider(db);

  // Create a test OAuth client
  const testClient = {
    client_id: "test-client-id",
    client_secret: "test-client-secret",
    redirect_uris: ["http://localhost:3000/callback"],
    scope: "mcp llm scope123 blob",
    client_id_issued_at: Math.floor(Date.now() / 1000),
    client_name: "Test Client",
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    token_endpoint_auth_method: "client_secret_basic",
  };

  await oauthStorage.saveClient(testClient);

  return {
    db,
    sqlite,
    oauthStorage,
    testClient,
    cleanup: () => {
      sqlite.close();
      if (fs.existsSync(tempDbPath)) {
        fs.unlinkSync(tempDbPath);
      }
    },
  };
}

/**
 * Test user credentials for integration tests
 */
export const TEST_USERS = {
  admin: {
    email: "admin@example.com",
    password: "admin123",
    expectedScopes: ["mcp", "llm", "scope123", "blob"],
  },
  user: {
    email: "user@example.com",
    password: "userpass",
    expectedScopes: ["mcp", "blob"],
  },
  limited: {
    email: "limited@example.com",
    password: "limited123",
    expectedScopes: ["mcp"],
  },
} as const;
