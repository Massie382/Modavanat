ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "phone" text;
--> statement-breakpoint
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "phone_verified" timestamp with time zone;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_phone_unique"
  ON "users" ("phone")
  WHERE "phone" IS NOT NULL;
