/**
 * Drizzle client — single source of truth for DB access.
 *
 * Dev environment: PGlite (PostgreSQL-in-process, file-backed, no
 * system install needed). Activated when DATABASE_URL starts with
 * `file:` or is unset. Data file lives at `db/dev.pglite`.
 *
 * Production: `postgres` (pure-JS driver, no native binary, no CDN).
 * Activated when DATABASE_URL is a `postgres://` / `postgresql://` URL.
 *
 * Both modes use the SAME schema (drizzle-orm/pg-core), so dev ↔ prod
 * migrations are identical — only the connection driver differs.
 */

import { drizzle } from "drizzle-orm/pglite";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import { PGlite } from "@electric-sql/pglite";
import postgres from "postgres";
import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL ?? "";
const DATA_DIR = process.cwd() + "/db";
const isPglite = DATABASE_URL === "" || DATABASE_URL.startsWith("file:");

declare global {
  // eslint-disable-next-line no-var
  var __dbClient: ReturnType<typeof createClient> | undefined;
  // eslint-disable-next-line no-var
  var __pglite: PGlite | undefined;
}

function createClient() {
  if (isPglite) {
    // Dev: in-process PGlite, persisted to a local file.
    // Reuse the same instance across HMR reloads in dev mode.
    const fileUrl =
      DATABASE_URL.startsWith("file:")
        ? DATABASE_URL.slice("file:".length)
        : `${DATA_DIR}/dev.pglite`;
    if (!global.__pglite) {
      global.__pglite = new PGlite(fileUrl);
    }
    return drizzle(global.__pglite, { schema });
  }
  // Production / remote Postgres — pure-JS driver, no native binary.
  const queryClient = postgres(DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  return drizzlePg(queryClient, { schema });
}

export const db = global.__dbClient ?? createClient();
if (process.env.NODE_ENV !== "production") global.__dbClient = db;

export type DB = typeof db;

// Re-export schema tables + types for convenience.
export * from "./schema";
