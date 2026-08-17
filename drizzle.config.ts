import "dotenv/config";
import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit config — drives `db:generate`, `db:push`, `db:migrate`,
 * `db:studio`.
 *
 *  Dev  : PGlite file at db/dev.pglite — no system install needed,
 *         in-process Postgres running in the Next.js server.
 *  Prod : real Postgres via DATABASE_URL (psql on VPS).
 *
 * The `driver: 'pglite'` flag is auto-selected when DATABASE_URL starts
 * with `file:` — otherwise we fall through to the default postgres
 * driver which expects a real DSN.
 */
const url = process.env.DATABASE_URL ?? "file:db/dev.pglite";
const isPglite = url.startsWith("file:");

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  ...(isPglite
    ? { driver: "pglite" as const, dbCredentials: { url } }
    : { dbCredentials: { url } }),
  verbose: true,
  strict: true,
});
