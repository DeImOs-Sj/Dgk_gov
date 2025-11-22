import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

export default {
  schema: "./src/database/schema.ts",
  out: "./src/database/migrations",
  driver: "mysql2",
  dbCredentials: {
    connectionString:
      process.env.DKGP_DATABASE_URL ||
      "mysql://root:@localhost:3306/dkg_publisher_db",
  },
  verbose: true,
  strict: true,
} satisfies Config;
