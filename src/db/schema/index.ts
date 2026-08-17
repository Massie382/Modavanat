// Barrel file — re-export all schema tables so callers can do
//   `import { laws, articles, users } from "@/db/schema"`.
// Also exported as `schema` for `drizzle.config.ts` and the Drizzle
// client wrapper (`drizzle(client, { schema })`).

// Import every schema module explicitly so we can compose them into a
// single `schema` namespace object WITHOUT creating a circular
// self-import (which is what `import * as schema from "./index"` would do).
import * as enums from "./_enums";
import * as lawsMod from "./laws";
import * as tocMod from "./toc_nodes";
import * as articlesMod from "./articles";
import * as amendmentsMod from "./amendments";
import * as referencesMod from "./references";
import * as authMod from "./auth";

export * from "./_enums";
export * from "./laws";
export * from "./toc_nodes";
export * from "./articles";
export * from "./amendments";
export * from "./references";
export * from "./auth";

export const schema = {
  ...enums,
  ...lawsMod,
  ...tocMod,
  ...articlesMod,
  ...amendmentsMod,
  ...referencesMod,
  ...authMod,
} satisfies Record<string, unknown>;
