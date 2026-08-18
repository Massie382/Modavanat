CREATE TABLE IF NOT EXISTS "vocabularies" (
  "key" text PRIMARY KEY NOT NULL,
  "label" text NOT NULL,
  "entries" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "updated_by" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "static_pages" (
  "id" text PRIMARY KEY NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "title" text NOT NULL,
  "eyebrow" text,
  "subtitle" text,
  "sections" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "visible" boolean NOT NULL DEFAULT true,
  "version" text NOT NULL DEFAULT '1.0',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "updated_by" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "law_pdfs" (
  "id" text PRIMARY KEY NOT NULL,
  "law_id" text NOT NULL,
  "label" text NOT NULL,
  "version" text,
  "file_path" text NOT NULL,
  "file_size" integer,
  "page_count" integer,
  "is_primary" boolean NOT NULL DEFAULT false,
  "uploaded_by" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "law_pdfs_law_id_laws_id_fk" FOREIGN KEY ("law_id") REFERENCES "laws"("id") ON DELETE CASCADE,
  CONSTRAINT "law_pdfs_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL
);
--> statement-breakpoint
ALTER TABLE "vocabularies"
  ADD CONSTRAINT "vocabularies_updated_by_users_id_fk"
  FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "static_pages"
  ADD CONSTRAINT "static_pages_updated_by_users_id_fk"
  FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "law_pdfs_law_id_idx" ON "law_pdfs" ("law_id");
--> statement-breakpoint
INSERT INTO "vocabularies" ("key", "label", "entries") VALUES
  ('status', 'وضعیت قانون', '[
    {"id":"in-force","label":"لازم‌الاجرا","englishLabel":"in-force","active":true},
    {"id":"amended","label":"اصلاح‌شده","englishLabel":"amended","active":true},
    {"id":"revoked","label":"منسوخ","englishLabel":"revoked","active":true},
    {"id":"pending","label":"در انتظار","englishLabel":"pending","active":true}
  ]'::jsonb)
  ON CONFLICT ("key") DO NOTHING;
--> statement-breakpoint
INSERT INTO "vocabularies" ("key", "label", "entries") VALUES
  ('type', 'نوع قانون', '[
    {"id":"قانون عادی","label":"قانون عادی","active":true},
    {"id":"قانون اساسی","label":"قانون اساسی","active":true},
    {"id":"آیین‌نامه","label":"آیین‌نامه","active":true},
    {"id":"بخشنامه","label":"بخشنامه","active":true},
    {"id":"مقررات","label":"مقررات","active":true}
  ]'::jsonb)
  ON CONFLICT ("key") DO NOTHING;
--> statement-breakpoint
INSERT INTO "vocabularies" ("key", "label", "entries") VALUES
  ('effect', 'نوع اثر اصلاح', '[
    {"id":"اصلاح","label":"اصلاح","description":"تغییر عبارت یا کلمات در متن ماده","active":true},
    {"id":"افزوده","label":"افزوده","description":"افزودن بند یا تبصره جدید","active":true},
    {"id":"حذف","label":"حذف","description":"حذف بخشی از ماده یا کل ماده","active":true},
    {"id":"جایگزینی","label":"جایگزینی","description":"جایگزینی کامل یک ماده با متن جدید","active":true},
    {"id":"الحاق","label":"الحاق","description":"افزودن ماده یا بند جدید به قانون","active":true},
    {"id":"توضیح","label":"توضیح","description":"توضیح تکمیلی درباره متن ماده","active":true},
    {"id":"اجرا","label":"اجرا","description":"تاریخ اجرا یا لازم‌الاجرا شدن","active":true},
    {"id":"تفویض اختیار","label":"تفویض اختیار","description":"واگذاری اختیار به مرجع دیگر","active":true}
  ]'::jsonb)
  ON CONFLICT ("key") DO NOTHING;
--> statement-breakpoint
INSERT INTO "vocabularies" ("key", "label", "entries") VALUES
  ('direction', 'جهت ارجاع', '[
    {"id":"cites","label":"ارجاع می‌کند","englishLabel":"cites","active":true},
    {"id":"cited-by","label":"ارجاع داده شده","englishLabel":"cited-by","active":true},
    {"id":"amends","label":"اصلاح می‌کند","englishLabel":"amends","active":true},
    {"id":"amended-by","label":"اصلاح شده توسط","englishLabel":"amended-by","active":true},
    {"id":"related","label":"مرتبط","englishLabel":"related","active":true}
  ]'::jsonb)
  ON CONFLICT ("key") DO NOTHING;
--> statement-breakpoint
INSERT INTO "vocabularies" ("key", "label", "entries") VALUES
  ('toc', 'نوع ردیف فهرست', '[
    {"id":"book","label":"کتاب","englishLabel":"book","active":true},
    {"id":"part","label":"بخش","englishLabel":"part","active":true},
    {"id":"chapter","label":"فصل","englishLabel":"chapter","active":true},
    {"id":"section","label":"بخش فرعی","englishLabel":"section","active":true},
    {"id":"article","label":"ماده","englishLabel":"article","active":true},
    {"id":"schedule","label":"پیوست","englishLabel":"schedule","active":true},
    {"id":"note","label":"تبصره","englishLabel":"note","active":true}
  ]'::jsonb)
  ON CONFLICT ("key") DO NOTHING;
--> statement-breakpoint
INSERT INTO "static_pages" ("id","slug","title","eyebrow","subtitle","sections","visible","version") VALUES
  ('sp-privacy','privacy','سیاست حریم خصوصی','حریم خصوصی',
   'نحوه جمع‌آوری، استفاده و حفاظت از اطلاعات شما در مدونات',
   '[{"id":"p1","heading":"مقدمه","body":"این سیاست نحوه گردآوری، استفاده و افشای اطلاعات شما را توضیح می‌دهد.","visible":true}]'::jsonb,
   true,'1.0')
  ON CONFLICT ("slug") DO NOTHING;
--> statement-breakpoint
INSERT INTO "static_pages" ("id","slug","title","eyebrow","subtitle","sections","visible","version") VALUES
  ('sp-about','about','درباره ما','درباره مدونات',
   'معرفی پایگاه مدونات و اهداف آن',
   '[{"id":"a1","heading":"درباره مدونات","body":"مدونات مرجع جامع قوانین و مقررات جمهوری اسلامی ایران است.","visible":true}]'::jsonb,
   true,'1.0')
  ON CONFLICT ("slug") DO NOTHING;
--> statement-breakpoint
INSERT INTO "static_pages" ("id","slug","title","eyebrow","subtitle","sections","visible","version") VALUES
  ('sp-terms','terms','شرایط استفاده','شرایط استفاده',
   'قواعد استفاده از پایگاه مدونات',
   '[{"id":"t1","heading":"پذیرش شرایط","body":"استفاده از مدونات به معنی پذیرش این شرایط است.","visible":true}]'::jsonb,
   true,'1.0')
  ON CONFLICT ("slug") DO NOTHING;
--> statement-breakpoint
INSERT INTO "static_pages" ("id","slug","title","eyebrow","subtitle","sections","visible","version") VALUES
  ('sp-contact','contact','تماس با ما','تماس',
   'راه‌های ارتباطی با تیم مدونات',
   '[{"id":"c1","heading":"راه‌های تماس","body":"می‌توانید از طریق فرم تماس یا ایمیل با ما در ارتباط باشید.","visible":true}]'::jsonb,
   true,'1.0')
  ON CONFLICT ("slug") DO NOTHING;
--> statement-breakpoint
