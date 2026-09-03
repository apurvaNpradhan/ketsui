import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

import type { Config } from "drizzle-kit";

// Load host-development values when the file exists; Compose supplies env directly.
const envFile = "../../.env";
if (existsSync(envFile)) loadEnvFile(envFile);

const authDatabaseUrl = process.env.AUTH_MIGRATION_DATABASE_URL ?? process.env.AUTH_DATABASE_URL;
if (!authDatabaseUrl) {
  throw new Error("AUTH_MIGRATION_DATABASE_URL or AUTH_DATABASE_URL must be set");
}

export default {
  out: "./migrations",
  schema: "./src/schema/index.ts",
  breakpoints: true,
  verbose: true,
  strict: true,

  dialect: "postgresql",
  dbCredentials: {
    url: authDatabaseUrl,
  },
} satisfies Config;
