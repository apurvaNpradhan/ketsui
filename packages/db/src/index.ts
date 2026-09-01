import "@tanstack/react-start/server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { authRelations } from "./schema/auth.schema";
import { relations } from "./schema/relations";

const authDatabaseUrl = process.env.AUTH_DATABASE_URL;
if (!authDatabaseUrl) throw new Error("AUTH_DATABASE_URL must be set");

const client = postgres(authDatabaseUrl);

export const db = drizzle({
  client,
  // authRelations uses defineRelationsPart,
  // so it must come after the main relations.
  // https://orm.drizzle.team/docs/relations-v2#relations-parts
  relations: { ...relations, ...authRelations },
});
