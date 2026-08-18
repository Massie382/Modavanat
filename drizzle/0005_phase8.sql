ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "preferences" jsonb NOT NULL DEFAULT '{}'::jsonb;
--> statement-breakpoint
UPDATE "users"
SET "preferences" = COALESCE(("image"::jsonb)->'prefs', '{}'::jsonb)
WHERE "image" IS NOT NULL AND "image" LIKE '{"__prefs"%';
--> statement-breakpoint
UPDATE "users"
SET "image" = NULL
WHERE "image" IS NOT NULL AND "image" LIKE '{"__prefs"%';
