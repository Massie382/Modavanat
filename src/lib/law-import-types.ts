/**
 * Law Import File — JSON schema for importing laws into the database.
 *
 * Each file describes ONE law with all of its content: TOC tree,
 * articles, commentary, amendments, references, etc. Files are dropped
 * into `laws-import/` and ingested by `scripts/import-laws.ts`.
 *
 * Cross-law references work seamlessly: any `lawId` field that
 * references another law will be resolved at import time. If the
 * referenced law isn't yet in the DB, the FK is left null and only the
 * denormalized title/year/number is stored — so refs are not lost if
 * you import in the wrong order.
 *
 * The shape mirrors `src/lib/types.ts` (the in-memory Law interface the
 * front-end already uses), so the same TS types can be reused. We keep
 * a separate set here for clarity + import-time validation.
 */

import { z } from "zod";

// ── Effect types (must match the DB enum) ────────────────────────────
export const effectTypeSchema = z.enum([
  "اصلاح",
  "افزوده",
  "حذف",
  "جایگزینی",
  "الحاق",
  "توضیح",
  "اجرا",
  "تفویض اختیار",
]);

// ── TOC node types — the 4-level hierarchy. We allow the legacy types
// (part, schedule, note) for backward-compat with existing data, but
// the importer will warn if they're used.
export const tocNodeTypeSchema = z.enum([
  "book",      // کتاب
  "chapter",   // فصل
  "section",   // باب
  "topic",     // مبحث
  "part",      // (legacy)
  "schedule",  // (legacy)
  "note",      // (legacy)
]);

export const lawStatusSchema = z.enum([
  "in-force",
  "amended",
  "revoked",
  "pending",
]);

export const lawTypeSchema = z.enum([
  "قانون عادی",
  "قانون اساسی",
  "آیین‌نامه",
  "بخشنامه",
  "مقررات",
]);

// ── Reference to another law (denormalized for resilience) ──────────
export const provisionRefSchema = z.object({
  lawId: z.string(),               // target law ID; resolved at import time
  title: z.string(),
  year: z.number().int(),
  number: z.string().optional(),
  provisionLabel: z.string().optional(), // e.g. «ماده ۵»
  provisionId: z.string().optional(),    // FK to articles.id if known
});

// ── Commentary item (یادداشت ویرایشی on an article) ──────────────
export const commentaryItemSchema = z.object({
  marker: z.string(),               // «ت1»
  effectType: effectTypeSchema,
  date: z.string(),                 // Jalali text
  affectingLaw: provisionRefSchema,
  text: z.string(),
});

// ── Article (ماده) ──────────────────────────────────────────────────
export const articleNodeSchema: z.ZodType<ArticleNodeShape> = z.lazy(() =>
  z.object({
    id: z.string(),
    tocNodeId: z.string().optional(), // the مبحث it belongs to (resolved by importer)
    number: z.string(),
    title: z.string().optional(),
    text: z.string(),                // may contain [تN]...[تN] markers
    orderIndex: z.number().int().optional().default(0),
    commentary: z.array(commentaryItemSchema).optional(),
    children: z.array(articleNodeSchema).optional(), // for sub-provisions (بند / تبصره)
  })
);

interface ArticleNodeShape {
  id: string;
  tocNodeId?: string;
  number: string;
  title?: string;
  text: string;
  orderIndex?: number;
  commentary?: z.infer<typeof commentaryItemSchema>[];
  children?: ArticleNodeShape[];
}

// ── TOC node (the 4-level tree: کتاب → فصل → باب → مبحث) ──────────
export const tocItemSchema: z.ZodType<TocItemShape> = z.lazy(() =>
  z.object({
    id: z.string(),
    type: tocNodeTypeSchema,
    label: z.string(),               // «کتاب اول»
    title: z.string().optional(),    // «احکام عمومی»
    orderIndex: z.number().int().optional().default(0),
    children: z.array(tocItemSchema).optional(),
    // Article IDs that belong to this مبحث — used at import time to
    // resolve article.tocNodeId. Only meaningful for type='topic'.
    articleIds: z.array(z.string()).optional(),
  })
);

interface TocItemShape {
  id: string;
  type: z.infer<typeof tocNodeTypeSchema>;
  label: string;
  title?: string;
  orderIndex?: number;
  children?: TocItemShape[];
  articleIds?: string[];
}

// ── Diff segment (optional pre-computed diff) ───────────────────────
export const diffSegmentSchema = z.object({
  type: z.enum(["same", "removed", "added"]),
  text: z.string(),
});

// ── Amendment event ─────────────────────────────────────────────────
export const amendmentEventSchema = z.object({
  id: z.string().optional(), // auto-generated if omitted
  date: z.string(),
  dateLabel: z.string(),
  effectType: effectTypeSchema,
  affectedProvision: z.string(),      // «ماده ۱۰»
  affectedProvisionId: z.string().optional(), // article ID
  affectingLaw: provisionRefSchema,
  description: z.string(),
  appliedToText: z.boolean().optional().default(false),
  note: z.string().optional(),
  beforeText: z.string().optional(),
  afterText: z.string().optional(),
  diffSegments: z.array(diffSegmentSchema).optional(),
});

// ── Outstanding (pending) change ─────────────────────────────────────
export const outstandingChangeSchema = z.object({
  id: z.string().optional(),
  affectedProvision: z.string(),
  effectType: effectTypeSchema,
  affectingLaw: provisionRefSchema,
  description: z.string(),
  expectedDate: z.string().optional(),
});

// ── Cross-law reference ─────────────────────────────────────────────
export const referenceRelationSchema = z.object({
  id: z.string().optional(),
  direction: z.enum(["cites", "cited-by", "amends", "amended-by", "related"]),
  target: provisionRefSchema,
  context: z.string(),
  sourceProvision: z.string().optional(), // «ماده ۵»
  targetProvision: z.string().optional(), // «تبصره ۲ ماده ۹»
});

// ── The top-level Law Import File ──────────────────────────────────
export const lawImportFileSchema = z.object({
  schemaVersion: z.literal(1),
  law: z.object({
    id: z.string(),
    title: z.string(),
    shortTitle: z.string().optional(),
    type: lawTypeSchema,
    year: z.number().int(),
    number: z.string().optional(),
    status: lawStatusSchema.optional().default("in-force"),
    extent: z.string(),
    subject: z.string(),
    promulgatingAuthority: z.string(),
    approvedDate: z.string(),
    effectiveDate: z.string(),
    lastRevisionDate: z.string(),
    description: z.string(),
    longDescription: z.string().optional(),
    originalVersion: z
      .object({
        approvedDate: z.string(),
        description: z.string(),
      })
      .optional(),
  }),
  toc: z.array(tocItemSchema),
  articles: z.array(articleNodeSchema),
  amendments: z.array(amendmentEventSchema).optional().default([]),
  outstandingChanges: z.array(outstandingChangeSchema).optional().default([]),
  references: z.array(referenceRelationSchema).optional().default([]),
});

export type LawImportFile = z.infer<typeof lawImportFileSchema>;
export type TocItemImport = z.infer<typeof tocItemSchema>;
export type ArticleNodeImport = z.infer<typeof articleNodeSchema>;
