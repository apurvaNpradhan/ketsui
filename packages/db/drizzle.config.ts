import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

import type { Config } from "drizzle-kit";

// Load host-development values when the file exists; Compose supplies env directly.
const envFile = "../../apps/web/.env";
if (existsSync(envFile)) loadEnvFile(envFile);

export default {
  out: "./migrations",
  schema: "./src/schema/index.ts",
  breakpoints: true,
  verbose: true,
  strict: true,

  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL as string,
  },
} satisfies Config;
