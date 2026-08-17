/**
 * @deprecated — use `@/db/client` directly. This thin shim exists for
 * legacy imports (`import { db } from "@/lib/db"`) that haven't been
 * migrated yet. It just re-exports the Drizzle client.
 */
export { db, type DB } from "@/db/client";
