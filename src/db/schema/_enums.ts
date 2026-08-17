import { pgEnum } from "drizzle-orm/pg-core";

// ── Law metadata enums ───────────────────────────────────────────────
export const lawType = pgEnum("law_type", [
  "قانون عادی",
  "قانون اساسی",
  "آیین‌نامه",
  "بخشنامه",
  "مقررات",
]);

export const lawStatus = pgEnum("law_status", [
  "in-force",
  "amended",
  "revoked",
  "pending",
]);

// ── TOC node type ───────────────────────────────────────────────────
// The four canonical levels of the Iranian legal TOC hierarchy:
//   کتاب (book) → فصل (chapter) → باب (section) → مبحث (topic)
// Articles (ماده) are NOT in this enum — they are stored in the
// `articles` table and attached to a مبحث via `toc_node_id`.
// The remaining types are kept for legacy compatibility with existing
// TOCItem shape but should not be used for new data.
export const tocNodeType = pgEnum("toc_node_type", [
  "book",      // کتاب
  "chapter",   // فصل
  "section",   // باب
  "topic",     // مبحث
  "part",      // (legacy) بخش
  "schedule",  // (legacy) پیوست
  "note",      // (legacy) یادداشت
]);

// ── Amendment / commentary effect types ──────────────────────────────
export const effectType = pgEnum("effect_type", [
  "اصلاح",                // words substituted / amended
  "افزوده",               // inserted
  "حذف",                  // omitted / repealed
  "جایگزینی",             // substituted
  "الحاق",                // addition (alt. spelling)
  "توضیح",                // explanation
  "اجرا",                 // coming into force
  "تفویض اختیار",         // power conferred
]);

// ── Diff segment type ────────────────────────────────────────────────
export const diffSegmentType = pgEnum("diff_segment_type", [
  "same",
  "removed",
  "added",
]);

// ── Reference direction ──────────────────────────────────────────────
export const referenceDirection = pgEnum("reference_direction", [
  "cites",
  "cited-by",
  "amends",
  "amended-by",
  "related",
]);

// ── Diff side (for pre-computed segments) ────────────────────────────
export const diffSide = pgEnum("diff_side", ["before", "after"]);
