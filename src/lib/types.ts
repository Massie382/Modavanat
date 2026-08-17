// Type definitions for the legal data model

export type LawStatus = "in-force" | "amended" | "revoked" | "pending";
export type LawType =
  | "قانون عادی"
  | "قانون اساسی"
  | "آیین‌نامه"
  | "بخشنامه"
  | "مقررات";

export type EffectType =
  | "اصلاح"                  // words substituted / amended
  | "افزوده"                 // inserted
  | "حذف"                    // omitted / repealed
  | "جایگزینی"               // substituted
  | "الحاق"                  // addition (alternate spelling used in some data)
  | "توضیح"                  // explanation
  | "اجرا"                   // coming into force
  | "تفویض اختیار";          // power conferred

export interface ProvisionRef {
  lawId: string;
  title: string;
  year: number;            // شماره سال خورشیدی
  number?: string;         // شماره ثبت
  provisionLabel?: string; // مثلاً «ماده ۵» یا «تبصره ۲ ماده ۹» — اختیاری چون برخی ارجاعات فقط به قانون کلی اشاره می‌کنند
  provisionId?: string;
}

export interface DiffSegment {
  type: "same" | "removed" | "added";
  text: string;
}

export interface AmendmentEvent {
  date: string;            // تاریخ شمسی نمایشی، مثلاً «۱۳۹۲/۰۱/۰۱»
  dateLabel: string;       // متن کوتاه مانند «اردیبهشت ۱۳۹۲»
  effectType: EffectType;
  affectedProvision: string;     // «ماده ۱۰»
  affectedProvisionId?: string;
  affectingLaw: ProvisionRef;    // قانون اصلاح‌کننده
  description: string;           // شرح تغییر به فارسی
  appliedToText: boolean;        // آیا در متن اعمال شده؟
  note?: string;
  // For the comparison view — author provides before/after text of the affected
  // provision. The front-end computes a word-level diff automatically. If the
  // author prefers, they can provide pre-computed `diffSegments` instead.
  beforeText?: string;
  afterText?: string;
  diffSegments?: DiffSegment[];
}

export interface CommentaryItem {
  marker: string;          // «ت۱»
  effectType: EffectType;
  date: string;
  affectingLaw: ProvisionRef;
  text: string;
}

export interface ArticleNode {
  id: string;
  number: string;          // «ماده ۱» یا «بند ۱»
  title?: string;
  text: string;            // متن ماده (می‌تواند شامل نشانگرهای F باشد)
  commentary?: CommentaryItem[];
  children?: ArticleNode[];
}

export interface TOCItem {
  id: string;
  label: string;           // «کتاب اول»، «فصل اول»، «مبحث نخست»
  title?: string;          // «احکام عمومی»
  // سلسله‌مراتب ساختاری فهرست مطالب: کتاب → فصل → باب → مبحث
  // مواد جداگانه در فهرست نشان داده نمی‌شوند؛ در زبانهٔ متن در دسترس‌اند.
  type: "book" | "chapter" | "section" | "topic" | "part" | "article" | "schedule" | "note";
  children?: TOCItem[];
  articleId?: string;      // در صورت وجود، اتصال به متن ماده (باقیمانده برای سازگاری)
  articleIds?: string[];   // فهرست مواد زیرمجموعهٔ این گره (برای فیلتر زبانهٔ متن)
}

export interface OutstandingChange {
  affectedProvision: string;
  effectType: EffectType;
  affectingLaw: ProvisionRef;
  description: string;
  expectedDate?: string;
}

export interface ReferenceRelation {
  direction: "cites" | "cited-by" | "amends" | "amended-by" | "related";
  target: ProvisionRef;
  context: string;         // شرح ارجاع
  sourceProvision?: string;// ماده مبدأ
  targetProvision?: string;// ماده مقصد
}

export interface Law {
  id: string;
  title: string;
  shortTitle?: string;
  type: LawType;
  year: number;            // سال تأسیس خورشیدی
  number?: string;         // شماره مصوبه
  status: LawStatus;
  extent: string;          // «کشوری»، «تهران»، ...
  subject: string;         // «مدنی»، «کیفری»، ...
  promulgatingAuthority: string; // «مجلس شورای اسلامی»، «دولت»
  approvedDate: string;    // تاریخ تصویب
  effectiveDate: string;   // تاریخ اجرا
  lastRevisionDate: string;// آخرین بازنگری
  description: string;     // شرح کوتاه قانون
  longDescription?: string;
  toc: TOCItem[];
  articles: ArticleNode[]; // متن مواد
  amendments: AmendmentEvent[];     // خط زمانی اصلاحات
  outstandingChanges: OutstandingChange[];
  references: ReferenceRelation[];
  // نسخه اصلی vs اصلاح‌شده — برای ساده‌سازی، نسخه فعلی همان اصلاح‌شده است و originalText در صورت نیاز جداگانه
  originalVersion?: {
    approvedDate: string;
    description: string;
  };
}

export interface DecadeStat {
  decade: string;          // «۱۳۷۰-۱۳۷۹»
  counts: { year: number; count: number }[];
}
