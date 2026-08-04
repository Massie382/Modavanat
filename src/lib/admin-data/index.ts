/**
 * Admin mock data layer.
 *
 * This is a FRONT-END-ONLY mock of the data the admin panel will eventually
 * read/write from a real backend. Every value here is the "current state" the
 * admin UI renders against. When the real API is wired up, swap these consts
 * for fetch hooks — the shapes should stay stable.
 *
 * All strings are Persian where they face the end user; admin-only labels
 * stay Persian too (the admin is Persian-speaking).
 */

import type { Law, LawStatus, LawType, EffectType } from "@/lib/types";
import { laws, referencedLawTitles } from "@/data/laws";

/* ───────────────────────────────────────────────────────────────────────
   Site settings — branding, chrome, contact
   ─────────────────────────────────────────────────────────────────────── */

export interface BrandingSettings {
  siteName: string;
  tagline: string;
  description: string;
  logos: {
    light: string;       // header
    dark: string;        // footer
    account: string;     // account panel
    favicon: string;
    ogImage: string;
    appleTouchIcon: string;
  };
  logoDimensions: { width: number; height: number };
  headerHeightDesktop: number;
  headerHeightMobile: number;
  containerMaxWidth: number;
  footerBlurb: string;
  copyrightText: string;
  version: string;
  lastUpdated: string;
  errorReportUrl: string;
  postalAddress: string;
  postalCode: string;
}

export const defaultBranding: BrandingSettings = {
  siteName: "مدونات",
  tagline: "مرجع قوانین و مقررات جمهوری اسلامی ایران",
  description:
    "جستجو، مرور و مطالعه قوانین و مقررات جمهوری اسلامی ایران به‌همراه خط زمانی اصلاحات و ارجاعات متقابل قانون‌ها.",
  logos: {
    light: "/brand/logo.webp",
    dark: "/brand/darklogo.webp",
    account: "/brand/logoaccount.webp",
    favicon: "",
    ogImage: "",
    appleTouchIcon: "",
  },
  logoDimensions: { width: 1536, height: 1024 },
  headerHeightDesktop: 175,
  headerHeightMobile: 130,
  containerMaxWidth: 1240,
  footerBlurb:
    "مرجع جامع قوانین و مقررات جمهوری اسلامی ایران. این پایگاه با هدف تسهیل دسترسی شهروندان، حقوق‌دانان و پژوهشگران به متن کامل قوانین کشور، خط زمانی اصلاحات و شبکه ارجاعات متقابل راه‌اندازی شده است.",
  copyrightText: "© ۱۴۰۴ مدونات (modavanat.ir). تمامی حقوق محفوظ است.",
  version: "نسخه ۲.۴.۱",
  lastUpdated: "۱۴۰۴/۰۵/۰۶",
  errorReportUrl: "mailto:tech@modavanat.ir",
  postalAddress: "تهران، خیابان ولیعصر، بالاتر از میدان ونک، پلاک ۱۲۳۴، طبقه ۴",
  postalCode: "۱۹۶۱۹۵۴۳۲۱",
};

/* ───────────────────────────────────────────────────────────────────────
   Navigation
   ─────────────────────────────────────────────────────────────────────── */

export interface NavItem {
  id: string;
  label: string;
  href: string;
  visible: boolean;
  openInNewTab?: boolean;
}

export interface NavColumn {
  id: string;
  title: string;
  links: NavItem[];
}

export interface NavigationSettings {
  topStripLinks: NavItem[];
  primaryNav: NavItem[];
  footerColumns: NavColumn[];
  authLinks: {
    signinLabel: string;
    signupLabel: string;
    signinHref: string;
    signupHref: string;
  };
  searchPlaceholder: string;
}

export const defaultNavigation: NavigationSettings = {
  topStripLinks: [
    { id: "ts-1", label: "دسترسی‌پذیری", href: "/accessibility", visible: true },
    { id: "ts-2", label: "راهنما", href: "/guide", visible: true },
    { id: "ts-3", label: "تماس با ما", href: "/contact", visible: true },
  ],
  primaryNav: [
    { id: "pn-1", label: "صفحه نخست", href: "/?view=home", visible: true },
    { id: "pn-2", label: "مرور قوانین", href: "/?view=browse", visible: true },
    { id: "pn-3", label: "جستجوی پیشرفته", href: "/?view=search", visible: true },
    { id: "pn-4", label: "درباره ما", href: "/?view=about", visible: true },
  ],
  footerColumns: [
    {
      id: "fc-1",
      title: "پیوندهای سریع",
      links: [
        { id: "fl-1", label: "صفحه نخست", href: "/?view=home", visible: true },
        { id: "fl-2", label: "مرور قوانین", href: "/?view=browse", visible: true },
        { id: "fl-3", label: "جستجوی پیشرفته", href: "/?view=search", visible: true },
        { id: "fl-4", label: "درباره ما", href: "/?view=about", visible: true },
        { id: "fl-5", label: "شبکه ارجاعات", href: "#", visible: true },
      ],
    },
    {
      id: "fc-2",
      title: "منابع و راهنما",
      links: [
        { id: "fl-6", label: "راهنمای استفاده", href: "/guide", visible: true },
        { id: "fl-7", label: "واژه‌نامه حقوقی", href: "#", visible: true },
        { id: "fl-8", label: "پرسش‌های پرتکرار", href: "#", visible: true },
        { id: "fl-9", label: "قواعد ارجاع‌دهی", href: "#", visible: true },
        { id: "fl-10", label: "دسترسی API", href: "#", visible: true },
      ],
    },
    {
      id: "fc-3",
      title: "درباره مدونات",
      links: [
        { id: "fl-11", label: "درباره ما", href: "/?view=about", visible: true },
        { id: "fl-12", label: "دسترسی‌پذیری", href: "/accessibility", visible: true },
        { id: "fl-13", label: "حریم خصوصی", href: "/privacy", visible: true },
        { id: "fl-14", label: "شرایط استفاده", href: "/terms", visible: true },
        { id: "fl-15", label: "تماس با ما", href: "/contact", visible: true },
      ],
    },
  ],
  authLinks: {
    signinLabel: "ورود",
    signupLabel: "ثبت‌نام",
    signinHref: "/signin",
    signupHref: "/signup",
  },
  searchPlaceholder: "جستجوی عنوان قانون، شماره، سال یا ماده…",
};

/* ───────────────────────────────────────────────────────────────────────
   SEO / metadata
   ─────────────────────────────────────────────────────────────────────── */

export interface SeoSettings {
  siteTitle: string;
  siteDescription: string;
  keywords: string[];
  author: string;
  metadataBase: string;
  defaultOgImage: string;
  twitterCard: "summary" | "summary_large_image" | "app";
  robotsIndex: boolean;
  robotsFollow: boolean;
  canonicalUrl: string;
  lang: string;
  dir: "rtl" | "ltr";
  robotsTxt: string;
  sitemapEnabled: boolean;
  sitemapUrl: string;
}

export const defaultSeo: SeoSettings = {
  siteTitle: "مدونات | مرجع جامع قوانین جمهوری اسلامی ایران",
  siteDescription:
    "جستجو، مرور و مطالعه قوانین و مقررات جمهوری اسلامی ایران به‌همراه خط زمانی اصلاحات و ارجاعات متقابل قانون‌ها.",
  keywords: [
    "قانون",
    "مدونات",
    "قوانین ایران",
    "قانون مدنی",
    "قانون مجازات اسلامی",
    "قانون تجارت",
    "قانون کار",
    "قانون اساسی",
  ],
  author: "modavanat.ir",
  metadataBase: "https://modavanat.ir",
  defaultOgImage: "",
  twitterCard: "summary_large_image",
  robotsIndex: true,
  robotsFollow: true,
  canonicalUrl: "https://modavanat.ir",
  lang: "fa",
  dir: "rtl",
  robotsTxt: `User-agent: Googlebot
Allow: /
User-agent: Bingbot
Allow: /
User-agent: Twitterbot
Allow: /
User-agent: facebookexternalhit
Allow: /
User-agent: *
Allow: /`,
  sitemapEnabled: true,
  sitemapUrl: "https://modavanat.ir/sitemap.xml",
};

/* ───────────────────────────────────────────────────────────────────────
   Theme / appearance
   ─────────────────────────────────────────────────────────────────────── */

export interface ThemeToken {
  key: string;
  label: string;
  value: string;
  group: "color" | "surface" | "ink" | "accent" | "badge" | "layout";
}

export interface ThemeSettings {
  defaultMode: "light" | "dark" | "system";
  radius: string;
  fontStack: string;
  lightTokens: ThemeToken[];
  darkTokens: ThemeToken[];
  statusBadges: {
    status: LawStatus;
    label: string;
    color: string;
    bgColor: string;
  }[];
  effectTypeColors: { type: EffectType; color: string }[];
}

export const defaultTheme: ThemeSettings = {
  defaultMode: "light",
  radius: "0.25rem",
  fontStack: '"vazirmatn", "Tahoma", "Arial", sans-serif',
  lightTokens: [
    { key: "--ink", label: "متن اصلی", value: "#1a1a1a", group: "ink" },
    { key: "--ink-soft", label: "مطمئن", value: "#3d3d3d", group: "ink" },
    { key: "--ink-muted", label: "خاکستری", value: "#6b6b6b", group: "ink" },
    { key: "--rule", label: "خط مرزی", value: "#d8d6d2", group: "layout" },
    { key: "--rule-soft", label: "خط نرم", value: "#ececea", group: "layout" },
    { key: "--surface", label: "سطح", value: "#ffffff", group: "surface" },
    { key: "--surface-raised", label: "سطح برجسته", value: "#fafaf8", group: "surface" },
    { key: "--surface-sunken", label: "سطح فرورفته", value: "#f4f3f0", group: "surface" },
    { key: "--charcoal", label: "زغالی", value: "#2b2b2b", group: "accent" },
    { key: "--charcoal-deep", label: "زغالی تیره", value: "#1f1f1f", group: "accent" },
    { key: "--accent-stripe", label: "نوار تأکید", value: "#8a8a8a", group: "accent" },
    { key: "--link", label: "پیوند", value: "#1a1a1a", group: "accent" },
    { key: "--link-hover", label: "پیوند (هاور)", value: "#000000", group: "accent" },
    { key: "--marker", label: "نشانگر F", value: "#2b2b2b", group: "accent" },
  ],
  darkTokens: [
    { key: "--ink", label: "متن اصلی", value: "#e8eaed", group: "ink" },
    { key: "--ink-soft", label: "مطمئن", value: "#a8aeb8", group: "ink" },
    { key: "--ink-muted", label: "خاکستری", value: "#6b7280", group: "ink" },
    { key: "--surface", label: "سطح", value: "#171a21", group: "surface" },
    { key: "--surface-raised", label: "سطح برجسته", value: "#1d2129", group: "surface" },
    { key: "--charcoal", label: "زغالی", value: "#0f1115", group: "accent" },
    { key: "--link", label: "پیوند", value: "#d4a574", group: "accent" },
  ],
  statusBadges: [
    { status: "in-force", label: "لازم‌الاجرا", color: "#2b2b2b", bgColor: "#f4f3f0" },
    { status: "amended", label: "اصلاح‌شده", color: "#5a5a5a", bgColor: "#ececea" },
    { status: "revoked", label: "منسوخ", color: "#7a7a7a", bgColor: "#f0efeb" },
    { status: "pending", label: "در انتظار", color: "#c08a3e", bgColor: "#faf0e0" },
  ],
  effectTypeColors: [
    { type: "اصلاح", color: "#d4a574" },
    { type: "افزوده", color: "#4a7c4a" },
    { type: "حذف", color: "#b85c5c" },
    { type: "جایگزینی", color: "#4a6c8a" },
    { type: "الحاق", color: "#7a5c8a" },
    { type: "توضیح", color: "#8a8a8a" },
    { type: "اجرا", color: "#2b5e2b" },
    { type: "تفویض اختیار", color: "#8a5c2b" },
  ],
};

/* ───────────────────────────────────────────────────────────────────────
   Vocabularies (enums)
   ─────────────────────────────────────────────────────────────────────── */

export interface VocabEntry {
  id: string;
  label: string;
  englishLabel?: string;
  description?: string;
  active: boolean;
}

export const lawStatusVocab: VocabEntry[] = [
  { id: "in-force", label: "لازم‌الاجرا", englishLabel: "in-force", active: true },
  { id: "amended", label: "اصلاح‌شده", englishLabel: "amended", active: true },
  { id: "revoked", label: "منسوخ", englishLabel: "revoked", active: true },
  { id: "pending", label: "در انتظار", englishLabel: "pending", active: true },
];

export const lawTypeVocab: VocabEntry[] = [
  { id: "قانون عادی", label: "قانون عادی", active: true },
  { id: "قانون اساسی", label: "قانون اساسی", active: true },
  { id: "آیین‌نامه", label: "آیین‌نامه", active: true },
  { id: "بخشنامه", label: "بخشنامه", active: true },
  { id: "مقررات", label: "مقررات", active: true },
];

export const effectTypeVocab: VocabEntry[] = [
  { id: "اصلاح", label: "اصلاح", description: "تغییر عبارت یا کلمات در متن ماده", active: true },
  { id: "افزوده", label: "افزوده", description: "افزودن بند یا تبصره جدید", active: true },
  { id: "حذف", label: "حذف", description: "حذف بخشی از ماده یا کل ماده", active: true },
  { id: "جایگزینی", label: "جایگزینی", description: "جایگزینی کامل یک ماده با متن جدید", active: true },
  { id: "الحاق", label: "الحاق", description: "افزودن ماده یا بند جدید به قانون", active: true },
  { id: "توضیح", label: "توضیح", description: "توضیح تکمیلی درباره متن ماده", active: true },
  { id: "اجرا", label: "اجرا", description: "تاریخ اجرا یا لازم‌الاجرا شدن", active: true },
  { id: "تفویض اختیار", label: "تفویض اختیار", description: "واگذاری اختیار به مرجع دیگر", active: true },
];

export const referenceDirectionVocab: VocabEntry[] = [
  { id: "cites", label: "ارجاع می‌کند", englishLabel: "cites", active: true },
  { id: "cited-by", label: "ارجاع داده شده", englishLabel: "cited-by", active: true },
  { id: "amends", label: "اصلاح می‌کند", englishLabel: "amends", active: true },
  { id: "amended-by", label: "اصلاح شده توسط", englishLabel: "amended-by", active: true },
  { id: "related", label: "مرتبط", englishLabel: "related", active: true },
];

export const tocTypeVocab: VocabEntry[] = [
  { id: "book", label: "کتاب", englishLabel: "book", active: true },
  { id: "part", label: "بخش", englishLabel: "part", active: true },
  { id: "chapter", label: "فصل", englishLabel: "chapter", active: true },
  { id: "section", label: "بخش فرعی", englishLabel: "section", active: true },
  { id: "article", label: "ماده", englishLabel: "article", active: true },
  { id: "schedule", label: "پیوست", englishLabel: "schedule", active: true },
  { id: "note", label: "تبصره", englishLabel: "note", active: true },
];

/* ───────────────────────────────────────────────────────────────────────
   Home page config
   ─────────────────────────────────────────────────────────────────────── */

export interface HomeSettings {
  heroEyebrow: string;
  heroHeadlineLine1: string;
  heroHeadlineLine2: string;
  heroIntro: string;
  searchTitleLabel: string;
  searchTitlePlaceholder: string;
  searchYearLabel: string;
  searchYearPlaceholder: string;
  searchTypeLabel: string;
  searchTypeOptions: { value: string; label: string }[];
  advancedSearchHref: string;
  searchGuideHref: string;
  keyboardHint: string;
  decadeSectionTitle: string;
  decadeSectionSubtitle: string;
  featuredLawsTitle: string;
  featuredLawsCount: number;
  featuredLawIds: string[];
  recentAmendmentsTitle: string;
  recentAmendmentsPageSize: number;
  siteStats: { label: string; value: string }[];
  tools: { id: string; label: string; href: string; visible: boolean }[];
  forLawyersTitle: string;
  forLawyersText: string;
  forLawyersHref: string;
  sectionsVisible: {
    hero: boolean;
    decades: boolean;
    featured: boolean;
    recentAmendments: boolean;
  };
}

export const defaultHomeSettings: HomeSettings = {
  heroEyebrow: "مرجع قوانین",
  heroHeadlineLine1: "جستجوی هوشمند قوانین",
  heroHeadlineLine2: "و مقررات جمهوری اسلامی ایران",
  heroIntro:
    "به‌طور کامل متن قوانین، خط زمانی اصلاحات، ارجاعات متقابل و یادداشت‌های ویرایشی را در یک پایگاه واحد جستجو کنید.",
  searchTitleLabel: "عنوان قانون",
  searchTitlePlaceholder: "مثلاً «قانون مدنی» یا «ماده ۱۰»",
  searchYearLabel: "سال",
  searchYearPlaceholder: "مثلاً ۱۳۰۷",
  searchTypeLabel: "نوع",
  searchTypeOptions: [
    { value: "all", label: "همه انواع" },
    { value: "قانون عادی", label: "قانون عادی" },
    { value: "قانون اساسی", label: "قانون اساسی" },
    { value: "آیین‌نامه", label: "آیین‌نامه" },
    { value: "بخشنامه", label: "بخشنامه" },
  ],
  advancedSearchHref: "/?view=search",
  searchGuideHref: "/guide",
  keyboardHint: "برای تمرکز روی جستجو، کلید / را بزنید",
  decadeSectionTitle: "مرور بر اساس دهه",
  decadeSectionSubtitle: "تعداد قوانین مصوب در هر دهه خورشیدی",
  featuredLawsTitle: "قوانین منتخب",
  featuredLawsCount: 4,
  featuredLawIds: ["q-madani-1307", "q-majazat-islami-1392", "q-tejarat-1302", "q-kar-1369"],
  recentAmendmentsTitle: "اصلاحات اخیر",
  recentAmendmentsPageSize: 8,
  siteStats: [
    { label: "کل قوانین", value: "۴۸۲۱" },
    { label: "لازم‌الاجرا", value: "۳۹۱۷" },
    { label: "منسوخ", value: "۹۰۴" },
    { label: "اصلاحات ثبت‌شده", value: "۱۸۲۳۹" },
    { label: "ارجاعات متقابل", value: "۴۷۱۲۰" },
  ],
  tools: [
    { id: "t1", label: "خوراک RSS", href: "#", visible: true },
    { id: "t2", label: "دانلود PDF", href: "#", visible: true },
    { id: "t3", label: "ارجاعات JSON", href: "#", visible: true },
    { id: "t4", label: "اشتراک‌گذاری ماده", href: "#", visible: true },
  ],
  forLawyersTitle: "برای حقوق‌دانان",
  forLawyersText: "دسترسی به شناسه‌های پایدار (DOI)، مستندات API و ابزارهای حرفه‌ای.",
  forLawyersHref: "#",
  sectionsVisible: { hero: true, decades: true, featured: true, recentAmendments: true },
};

/* ───────────────────────────────────────────────────────────────────────
   Browse / Search config
   ─────────────────────────────────────────────────────────────────────── */

export interface BrowseSettings {
  pageTitle: string;
  pageDescription: string;
  footerNote: string;
  defaultSortBy: "year" | "title" | "status";
  defaultSortDir: "asc" | "desc";
  columns: { id: string; label: string; visible: boolean; width: string }[];
  pageSize: number | null; // null = show all
  enablePagination: boolean;
}

export const defaultBrowseSettings: BrowseSettings = {
  pageTitle: "مرور قوانین",
  pageDescription:
    "فهرست کامل قوانین و مقررات جمهوری اسلامی ایران به‌ترتیب سال تصویب. برای فیلتر کردن از منوهای بالا استفاده کنید.",
  footerNote:
    "قوانین منسوخ با رنگ خاکستری نمایش داده می‌شوند. شماره ثبت مجلس برای قوانین مصوب پس از ۱۳۵۷ نمایش داده می‌شود.",
  defaultSortBy: "year",
  defaultSortDir: "desc",
  columns: [
    { id: "title", label: "عنوان قانون", visible: true, width: "44%" },
    { id: "year-number", label: "سال و شماره", visible: true, width: "16%" },
    { id: "type", label: "نوع", visible: true, width: "16%" },
    { id: "status", label: "وضعیت", visible: true, width: "12%" },
    { id: "subject", label: "موضوع", visible: true, width: "12%" },
  ],
  pageSize: null,
  enablePagination: false,
};

export interface SearchSettings {
  pageTitle: string;
  pageSubtitle: string;
  searchPlaceholder: string;
  resultsPageSize: number;
  facets: { id: string; label: string; visible: boolean }[];
  showMatchCounts: boolean;
  emptyStateTitle: string;
  emptyStateDesc: string;
  searchScope: {
    title: boolean;
    description: boolean;
    subject: boolean;
    year: boolean;
    number: boolean;
    articleText: boolean;
    articleNumber: boolean;
  };
  suggestionMax: number;
  suggestionEnabled: boolean;
}

export const defaultSearchSettings: SearchSettings = {
  pageTitle: "جستجوی پیشرفته",
  pageSubtitle: "جستجو در متن کامل قوانین، مواد و ارجاعات با فیلترهای پیشرفته",
  searchPlaceholder: "عبارت مورد نظر را وارد کنید…",
  resultsPageSize: 10,
  facets: [
    { id: "year", label: "سال تصویب", visible: true },
    { id: "subject", label: "موضوع", visible: true },
    { id: "type", label: "نوع قانون", visible: false },
    { id: "status", label: "وضعیت", visible: false },
    { id: "authority", label: "مرجع تصویب", visible: false },
  ],
  showMatchCounts: true,
  emptyStateTitle: "نتیجه‌ای یافت نشد",
  emptyStateDesc: "عبارت را اصلاح کنید یا فیلترها را تغییر دهید.",
  searchScope: {
    title: true,
    description: true,
    subject: true,
    year: true,
    number: true,
    articleText: true,
    articleNumber: true,
  },
  suggestionMax: 6,
  suggestionEnabled: true,
};

/* ───────────────────────────────────────────────────────────────────────
   Law detail config
   ─────────────────────────────────────────────────────────────────────── */

export interface LawDetailSettings {
  tabs: { id: string; label: string; visible: boolean; helpText: string }[];
  utilityButtons: { id: string; label: string; visible: boolean; href?: string }[];
  metadataGrid: { id: string; label: string; visible: boolean }[];
  showOutstandingChangesNotice: boolean;
  showBreadcrumb: boolean;
  showVersionToggle: boolean;
  citationTemplate: string;
  importantArticlesCount: number;
  externalResources: { id: string; label: string; href: string; visible: boolean }[];
  nextSteps: { id: string; label: string; href: string; visible: boolean }[];
  networkVisualization: boolean;
}

export const defaultLawDetailSettings: LawDetailSettings = {
  tabs: [
    { id: "contents", label: "فهرست مطالب", visible: true, helpText: "" },
    { id: "content", label: "متن قانون", visible: true, helpText: "" },
    { id: "timeline", label: "خط زمانی اصلاحات", visible: true, helpText: "تاریخچه کامل اصلاحات اعمال‌شده بر این قانون" },
    { id: "references", label: "ارجاعات", visible: true, helpText: "فهرست ارجاعات متقابل با سایر قوانین" },
    { id: "resources", label: "منابع بیشتر", visible: true, helpText: "منابع مرتبط شامل نسخه اصلی و منابع خارجی" },
  ],
  utilityButtons: [
    { id: "print", label: "چاپ", visible: true },
    { id: "pdf", label: "دانلود PDF", visible: true },
    { id: "rss", label: "اشتراک RSS", visible: true },
  ],
  metadataGrid: [
    { id: "approved", label: "تاریخ تصویب", visible: true },
    { id: "effective", label: "تاریخ اجرا", visible: true },
    { id: "revision", label: "آخرین بازنگری", visible: true },
    { id: "articles", label: "تعداد مواد", visible: true },
  ],
  showOutstandingChangesNotice: true,
  showBreadcrumb: true,
  showVersionToggle: true,
  citationTemplate: "{title} — مصوب {approvedDate} — مرجع: {promulgatingAuthority} — {siteName}",
  importantArticlesCount: 8,
  externalResources: [
    { id: "er1", label: "مجلس شورای اسلامی", href: "#", visible: true },
    { id: "er2", label: "روزنامه رسمی", href: "#", visible: true },
    { id: "er3", label: "آرا و مذاکرات", href: "#", visible: true },
    { id: "er4", label: "نظرات شورای نگهبان", href: "#", visible: true },
  ],
  nextSteps: [
    { id: "ns1", label: "مشاهده نسخه اصلی", href: "#", visible: true },
    { id: "ns2", label: "مشاهده ارجاعات", href: "#", visible: true },
    { id: "ns3", label: "خروجی PDF", href: "#", visible: true },
    { id: "ns4", label: "اشتراک‌گذاری", href: "#", visible: true },
  ],
  networkVisualization: true,
};

/* ───────────────────────────────────────────────────────────────────────
   Static pages
   ─────────────────────────────────────────────────────────────────────── */

export interface StaticPageSection {
  id: string;
  heading: string;
  body: string;
  visible: boolean;
}

export interface StaticPage {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  eyebrow: string;
  lastUpdated: string;
  version: string;
  sections: StaticPageSection[];
  visible: boolean;
}

export const defaultStaticPages: StaticPage[] = [
  {
    id: "sp-privacy",
    slug: "privacy",
    title: "سیاست حریم خصوصی",
    subtitle: "نحوه جمع‌آوری، استفاده و حفاظت از اطلاعات شما در مدونات",
    eyebrow: "حریم خصوصی",
    lastUpdated: "۱۴۰۴/۰۵/۰۶",
    version: "۱.۰",
    visible: true,
    sections: [
      { id: "p1", heading: "مقدمه", body: "این سیاست نحوه گردآوری، استفاده و افشای اطلاعات شما را توضیح می‌دهد…", visible: true },
      { id: "p2", heading: "دامنه کاربرد", body: "این سیاست تنها برای وب‌سایت مدونات اعمال می‌شود…", visible: true },
      { id: "p3", heading: "اطلاعات گردآوری‌شده", body: "اطلاعات کاربر، اطلاعات خودکار و اطلاعات اشخاص ثالث…", visible: true },
    ],
  },
  {
    id: "sp-terms",
    slug: "terms",
    title: "شرایط استفاده",
    subtitle: "قوانین و مقررات استفاده از خدمات مدونات",
    eyebrow: "شرایط",
    lastUpdated: "۱۴۰۴/۰۵/۰۶",
    version: "۱.۰",
    visible: true,
    sections: [
      { id: "t1", heading: "مقدمه", body: "با استفاده از این سایت، شرایط زیر را می‌پذیرید…", visible: true },
      { id: "t2", heading: "تعریف خدمات", body: "خدمات شامل جستجو، مرور و مطالعه قوانین است…", visible: true },
    ],
  },
  {
    id: "sp-accessibility",
    slug: "accessibility",
    title: "بیانیه دسترسی‌پذیری",
    subtitle: "تعهد ما به دسترسی‌پذیری برای همه کاربران",
    eyebrow: "دسترسی‌پذیری",
    lastUpdated: "۱۴۰۴/۰۵/۰۶",
    version: "۱.۰",
    visible: true,
    sections: [
      { id: "a1", heading: "مقدمه", body: "ما متعهد به رعایت استاندارد WCAG 2.1 سطح AA هستیم…", visible: true },
    ],
  },
  {
    id: "sp-guide",
    slug: "guide",
    title: "راهنمای استفاده",
    subtitle: "راهنمای کامل استفاده از امکانات مدونات",
    eyebrow: "راهنما",
    lastUpdated: "۱۴۰۴/۰۵/۰۶",
    version: "۱.۰",
    visible: true,
    sections: [
      { id: "g1", heading: "مقدمه", body: "این راهنما به شما کمک می‌کند تا از تمام امکانات سایت استفاده کنید…", visible: true },
    ],
  },
  {
    id: "sp-contact",
    slug: "contact",
    title: "تماس با ما",
    subtitle: "راه‌های ارتباطی با تیم مدونات",
    eyebrow: "تماس",
    lastUpdated: "۱۴۰۴/۰۵/۰۶",
    version: "۱.۰",
    visible: true,
    sections: [
      { id: "c1", heading: "ایمیل‌ها", body: "برای ارتباط با ما از ایمیل‌های زیر استفاده کنید…", visible: true },
    ],
  },
  {
    id: "sp-about",
    slug: "about",
    title: "درباره مدونات",
    subtitle: "معرفی پایگاه داده قوانین جمهوری اسلامی ایران",
    eyebrow: "درباره",
    lastUpdated: "۱۴۰۴/۰۵/۰۶",
    version: "۲.۴.۱",
    visible: true,
    sections: [
      { id: "ab1", heading: "مقدمه", body: "مدونات مرجع جامع قوانین و مقررات ایران است…", visible: true },
    ],
  },
];

/* ───────────────────────────────────────────────────────────────────────
   Contact emails (structured)
   ─────────────────────────────────────────────────────────────────────── */

export interface ContactEmail {
  id: string;
  role: string;
  address: string;
  description: string;
  visible: boolean;
}

export const defaultContactEmails: ContactEmail[] = [
  { id: "e1", role: "محتوا", address: "content@modavanat.ir", description: "گزارش خطاهای محتوایی قوانین", visible: true },
  { id: "e2", role: "فنی", address: "tech@modavanat.ir", description: "مشکلات فنی سایت", visible: true },
  { id: "e3", role: "دسترسی‌پذیری", address: "accessibility@modavanat.ir", description: "مسائل دسترسی‌پذیری", visible: true },
  { id: "e4", role: "عمومی", address: "info@modavanat.ir", description: "سوالات عمومی و همکاری", visible: true },
  { id: "e5", role: "حریم خصوصی", address: "privacy@modavanat.ir", description: "سوالات مربوط به حریم خصوصی", visible: true },
  { id: "e6", role: "امنیت", address: "security@modavanat.ir", description: "گزارش آسیب‌پذیری‌های امنیتی", visible: true },
];

/* ───────────────────────────────────────────────────────────────────────
   Auth config
   ─────────────────────────────────────────────────────────────────────── */

export interface AuthSettings {
  allowedIdentifiers: { id: "email" | "phone"; label: string; enabled: boolean }[];
  passwordMinLengthSignin: number;
  passwordMinLengthSignup: number;
  passwordMinLengthReset: number;
  strengthThresholds: { weak: number; medium: number; good: number; strong: number };
  otpLength: number;
  otpResendCooldownSec: number;
  rememberMeDefault: boolean;
  requireAgreement: boolean;
  agreementLinks: { label: string; href: string }[];
  signinPage: { eyebrow: string; title: string; subtitle: string };
  signupPage: { eyebrow: string; title: string; subtitle: string };
  forgotPasswordPage: { eyebrow: string; title: string; subtitle: string };
}

export const defaultAuthSettings: AuthSettings = {
  allowedIdentifiers: [
    { id: "email", label: "ایمیل", enabled: true },
    { id: "phone", label: "شماره تلفن", enabled: true },
  ],
  passwordMinLengthSignin: 6,
  passwordMinLengthSignup: 8,
  passwordMinLengthReset: 8,
  strengthThresholds: { weak: 1, medium: 2, good: 3, strong: 4 },
  otpLength: 6,
  otpResendCooldownSec: 60,
  rememberMeDefault: true,
  requireAgreement: true,
  agreementLinks: [
    { label: "حریم خصوصی", href: "/privacy" },
    { label: "شرایط استفاده", href: "/terms" },
  ],
  signinPage: { eyebrow: "ورود به حساب", title: "خوش آمدید", subtitle: "برای دسترسی به امکانات شخصی مدونات وارد شوید." },
  signupPage: { eyebrow: "ثبت‌نام", title: "ساخت حساب کاربری", subtitle: "برای ذخیره قوانین موردعلاقه و یادآوری یادداشت‌ها ثبت‌نام کنید." },
  forgotPasswordPage: { eyebrow: "بازیابی رمز عبور", title: "رمز عبور را فراموش کرده‌اید؟", subtitle: "ایمیل یا شماره تلفن خود را وارد کنید تا کد بازنشانی برای شما ارسال شود." },
};

/* ───────────────────────────────────────────────────────────────────────
   Account panel config
   ─────────────────────────────────────────────────────────────────────── */

export interface AccountSettings {
  visibleTabs: { id: "bookmarks" | "settings" | "tickets" | "purchases"; label: string; visible: boolean }[];
  ticketCategories: { id: string; label: string; active: boolean }[];
  ticketStatuses: { id: string; label: string; color: string }[];
  purchaseStatuses: { id: string; label: string; color: string }[];
  paymentMethods: { id: string; label: string; active: boolean }[];
  preferences: { id: string; label: string; description: string; defaultOn: boolean; visible: boolean }[];
  bookmarksPageSize: number;
  ticketsPageSize: number;
  purchasesPageSize: number;
  accountLogo: string;
}

export const defaultAccountSettings: AccountSettings = {
  visibleTabs: [
    { id: "bookmarks", label: "نشانه‌گذاری‌ها", visible: true },
    { id: "settings", label: "تنظیمات", visible: true },
    { id: "tickets", label: "تیکت‌ها", visible: true },
    { id: "purchases", label: "خریدها", visible: true },
  ],
  ticketCategories: [
    { id: "technical", label: "فنی", active: true },
    { id: "content", label: "محتوایی", active: true },
    { id: "add-law", label: "درخواست افزودن قانون", active: true },
    { id: "suggestion", label: "پیشنهاد", active: true },
    { id: "accessibility", label: "دسترسی‌پذیری", active: true },
    { id: "other", label: "سایر", active: true },
  ],
  ticketStatuses: [
    { id: "open", label: "باز", color: "#4a7c4a" },
    { id: "pending", label: "در حال بررسی", color: "#c08a3e" },
    { id: "closed", label: "بسته", color: "#6b7280" },
  ],
  purchaseStatuses: [
    { id: "paid", label: "پرداخت‌شده", color: "#4a7c4a" },
    { id: "pending", label: "در انتظار", color: "#c08a3e" },
    { id: "refunded", label: "بازگشت‌خورده", color: "#4a6c8a" },
    { id: "failed", label: "ناموفق", color: "#b85c5c" },
  ],
  paymentMethods: [
    { id: "zarinpal", label: "زرین‌پال", active: true },
    { id: "samankish", label: "سامان کیش", active: true },
    { id: "bank-transfer", label: "انتقال بانکی", active: true },
  ],
  preferences: [
    { id: "emailNotifications", label: "اطلاع‌رسانی ایمیلی", description: "دریافت اعلان‌ها از طریق ایمیل", defaultOn: true, visible: true },
    { id: "smsNotifications", label: "اطلاع‌رسانی پیامکی", description: "دریافت اعلان‌ها از طریق پیامک", defaultOn: false, visible: true },
    { id: "weeklyDigest", label: "گزارش هفتگی", description: "خلاصه هفتگی اصلاحات قوانین نشانه‌گذاری‌شده", defaultOn: true, visible: true },
    { id: "bookmarkAlerts", label: "هشدار نشانه‌گذاری‌ها", description: "اطلاع از اصلاحات قوانین نشانه‌گذاری‌شده", defaultOn: false, visible: true },
  ],
  bookmarksPageSize: 5,
  ticketsPageSize: 5,
  purchasesPageSize: 8,
  accountLogo: "/brand/logoaccount.webp",
};

/* ───────────────────────────────────────────────────────────────────────
   Users
   ─────────────────────────────────────────────────────────────────────── */

export type AdminRole = "super-admin" | "editor" | "moderator" | "viewer";

export interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  email: string;
  phone?: string;
  role: AdminRole;
  status: "active" | "suspended" | "invited";
  lastLogin: string;
  createdAt: string;
  avatarColor: string;
}

export const defaultAdminUsers: AdminUser[] = [
  { id: "u1", username: "admin", displayName: "مدیر ارشد", email: "admin@modavanat.ir", role: "super-admin", status: "active", lastLogin: "۱۴۰۴/۰۵/۰۶ ۱۰:۲۳", createdAt: "۱۴۰۲/۰۳/۱۵", avatarColor: "#d4a574" },
  { id: "u2", username: "editor1", displayName: "سردبیر محتوا", email: "editor@modavanat.ir", role: "editor", status: "active", lastLogin: "۱۴۰۴/۰۵/۰۵ ۱۶:۴۵", createdAt: "۱۴۰۲/۰۶/۰۱", avatarColor: "#4a7c4a" },
  { id: "u3", username: "mod1", displayName: "ناظر ارجاعات", email: "mod@modavanat.ir", role: "moderator", status: "active", lastLogin: "۱۴۰۴/۰۵/۰۴ ۰۹:۱۲", createdAt: "۱۴۰۳/۰۱/۲۰", avatarColor: "#4a6c8a" },
  { id: "u4", username: "viewer1", displayName: "کاربر مشاهده‌گر", email: "viewer@modavanat.ir", role: "viewer", status: "invited", lastLogin: "—", createdAt: "۱۴۰۴/۰۴/۲۸", avatarColor: "#7a5c8a" },
];

export const roleLabels: Record<AdminRole, string> = {
  "super-admin": "مدیر ارشد",
  editor: "ویراستار",
  moderator: "ناظر",
  viewer: "مشاهده‌گر",
};

export const rolePermissions: Record<AdminRole, string[]> = {
  "super-admin": ["همه دسترسی‌ها", "مدیریت کاربران", "تنظیمات سایت", "ویرایش قوانین", "مدیریت محتوا"],
  editor: ["ویرایش قوانین", "مدیریت محتوا", "مدیریت صفحات ایستا"],
  moderator: ["بازبینی ارجاعات", "پاسخ به تیکت‌ها", "مدیریت نشانه‌گذاری‌ها"],
  viewer: ["مشاهده آمار", "مشاهده قوانین"],
};

/* ───────────────────────────────────────────────────────────────────────
   End-user registry (mock)
   ─────────────────────────────────────────────────────────────────────── */

export interface EndUser {
  id: string;
  username: string;
  displayName: string;
  email: string;
  phone?: string;
  status: "active" | "suspended" | "deleted";
  bookmarksCount: number;
  ticketsCount: number;
  purchasesCount: number;
  joinedAt: string;
  lastActive: string;
  avatarColor: string;
}

export const defaultEndUsers: EndUser[] = Array.from({ length: 24 }, (_, i) => {
  const colors = ["#d4a574", "#4a7c4a", "#4a6c8a", "#7a5c8a", "#c08a3e", "#b85c5c"];
  const names = ["علی محمدی", "زهرا حسینی", "محمد رضایی", "فاطمه کریمی", "حسین موسوی", "مریم احمدی", "رضا قاسمی", "سارا نوری"];
  const statuses: EndUser["status"][] = ["active", "active", "active", "suspended", "active", "active", "active", "deleted"];
  return {
    id: `eu-${i + 1}`,
    username: `user${i + 1}`,
    displayName: names[i % names.length],
    email: `user${i + 1}@example.com`,
    phone: `0912${String(1000000 + i).padStart(7, "0")}`,
    status: statuses[i % statuses.length],
    bookmarksCount: Math.floor(Math.random() * 30),
    ticketsCount: Math.floor(Math.random() * 5),
    purchasesCount: Math.floor(Math.random() * 3),
    joinedAt: `۱۴۰۳/${String((i % 12) + 1).padStart(2, "0")}/${String((i % 28) + 1).padStart(2, "0")}`,
    lastActive: `۱۴۰۴/۰۵/${String((i % 6) + 1).padStart(2, "0")}`,
    avatarColor: colors[i % colors.length],
  };
});

/* ───────────────────────────────────────────────────────────────────────
   PDFs per law
   ─────────────────────────────────────────────────────────────────────── */

export interface LawPdf {
  id: string;
  lawId: string;
  title: string;
  filename: string;
  sizeKb: number;
  uploadedAt: string;
  uploadedBy: string;
  version: string;        // «اصلی»، «اصلاح‌شده ۱۳۸۷»، …
  isPrimary: boolean;
  pages: number;
}

export const defaultLawPdfs: LawPdf[] = [
  { id: "pdf-1", lawId: "q-madani-1307", title: "نسخه اصلی ۱۳۰۷", filename: "q-madani-1307-original.pdf", sizeKb: 2450, uploadedAt: "۱۴۰۳/۰۵/۱۰", uploadedBy: "admin", version: "اصلی ۱۳۰۷", isPrimary: true, pages: 312 },
  { id: "pdf-2", lawId: "q-madani-1307", title: "نسخه اصلاح‌شده ۱۳۸۷", filename: "q-madani-1307-revised-1387.pdf", sizeKb: 2890, uploadedAt: "۱۴۰۳/۰۵/۱۰", uploadedBy: "editor1", version: "اصلاح ۱۳۸۷", isPrimary: false, pages: 348 },
  { id: "pdf-3", lawId: "q-madani-1307", title: "جدول تغییرات", filename: "q-madani-1307-changes.pdf", sizeKb: 540, uploadedAt: "۱۴۰۳/۰۶/۰۲", uploadedBy: "editor1", version: "خلاصه اصلاحات", isPrimary: false, pages: 28 },
  { id: "pdf-4", lawId: "q-majazat-islami-1392", title: "متن کامل ۱۳۹۲", filename: "q-majazat-1392.pdf", sizeKb: 3200, uploadedAt: "۱۴۰۳/۰۴/۲۲", uploadedBy: "admin", version: "اصلی ۱۳۹۲", isPrimary: true, pages: 412 },
  { id: "pdf-5", lawId: "q-asasi-1358", title: "قانون اساسی بازنگری ۱۳۶۸", filename: "q-asasi-1368.pdf", sizeKb: 1800, uploadedAt: "۱۴۰۳/۰۳/۱۵", uploadedBy: "admin", version: "بازنگری ۱۳۶۸", isPrimary: true, pages: 177 },
];

/* ───────────────────────────────────────────────────────────────────────
   Bookmarks / Tickets / Purchases (admin view)
   ─────────────────────────────────────────────────────────────────────── */

export interface AdminBookmark {
  id: string;
  user: string;
  lawId: string;
  lawTitle: string;
  addedAt: string;
  note?: string;
}

export const defaultAdminBookmarks: AdminBookmark[] = Array.from({ length: 18 }, (_, i) => ({
  id: `bm-${i + 1}`,
  user: `user${(i % 12) + 1}`,
  lawId: laws[i % laws.length].id,
  lawTitle: laws[i % laws.length].title,
  addedAt: `۱۴۰۴/۰${(i % 5) + 1}/${String((i % 28) + 1).padStart(2, "0")}`,
  note: i % 3 === 0 ? "برای پرونده نیاز دارم" : undefined,
}));

export interface AdminTicket {
  id: string;
  subject: string;
  user: string;
  category: string;
  status: "open" | "pending" | "closed";
  createdAt: string;
  updatedAt: string;
  lastReply: string;
  priority: "low" | "medium" | "high";
}

export const defaultAdminTickets: AdminTicket[] = Array.from({ length: 14 }, (_, i) => {
  const subjects = ["خطا در نمایش ماده ۱۰", "درخواست افزودن قانون جدید", "مشکل ورود به حساب", "گزارش ارجاع اشتباه", "پیشنهاد بهبود جستجو"];
  const cats = ["technical", "content", "add-law", "suggestion", "accessibility", "other"];
  const statuses: AdminTicket["status"][] = ["open", "pending", "closed"];
  const prios: AdminTicket["priority"][] = ["low", "medium", "high"];
  return {
    id: `TK-${1000 + i}`,
    subject: subjects[i % subjects.length],
    user: `user${(i % 12) + 1}`,
    category: cats[i % cats.length],
    status: statuses[i % statuses.length],
    createdAt: `۱۴۰۴/۰${(i % 5) + 1}/${String((i % 28) + 1).padStart(2, "0")}`,
    updatedAt: `۱۴۰۴/۰۵/${String((i % 6) + 1).padStart(2, "0")}`,
    lastReply: `۱۴۰۴/۰۵/${String((i % 6) + 1).padStart(2, "0")} ${String(10 + i).padStart(2, "0")}:۳۰`,
    priority: prios[i % prios.length],
  };
});

export interface AdminPurchase {
  id: string;
  user: string;
  description: string;
  invoiceNumber: string;
  amount: number;
  status: "paid" | "pending" | "refunded" | "failed";
  method: string;
  date: string;
}

export const defaultAdminPurchases: AdminPurchase[] = Array.from({ length: 16 }, (_, i) => {
  const descs = ["خرید اشتراک ویژه یک‌ساله", "دانلود PDF قانون مدنی", "اشتراک ماهانه", "گزارش تخصصی"];
  const statuses: AdminPurchase["status"][] = ["paid", "paid", "pending", "refunded", "failed"];
  const methods = ["زرین‌پال", "سامان کیش", "انتقال بانکی"];
  return {
    id: `pu-${i + 1}`,
    user: `user${(i % 12) + 1}`,
    description: descs[i % descs.length],
    invoiceNumber: `INV-${14000 + i}`,
    amount: [99000, 49000, 29000, 199000][i % 4],
    status: statuses[i % statuses.length],
    method: methods[i % methods.length],
    date: `۱۴۰۴/۰${(i % 5) + 1}/${String((i % 28) + 1).padStart(2, "0")}`,
  };
});

/* ───────────────────────────────────────────────────────────────────────
   Activity log + notifications
   ─────────────────────────────────────────────────────────────────────── */

export interface ActivityEntry {
  id: string;
  actor: string;
  action: string;
  target: string;
  at: string;
  type: "law" | "user" | "content" | "settings" | "auth";
}

export const defaultActivity: ActivityEntry[] = [
  { id: "ac1", actor: "admin", action: "قانون جدید افزود", target: "قانون حمایت مصرف‌کننده", at: "۱۴۰۴/۰۵/۰۶ ۱۰:۲۳", type: "law" },
  { id: "ac2", actor: "editor1", action: "ماده ۱۰ را اصلاح کرد", target: "قانون مدنی", at: "۱۴۰۴/۰۵/۰۶ ۰۹:۱۵", type: "law" },
  { id: "ac3", actor: "mod1", action: "ارجاع جدید ثبت کرد", target: "قانون مجازات اسلامی", at: "۱۴۰۴/۰۵/۰۵ ۱۶:۴۵", type: "law" },
  { id: "ac4", actor: "admin", action: "کاربر را تعلیق کرد", target: "user3", at: "۱۴۰۴/۰۵/۰۵ ۱۴:۱۰", type: "user" },
  { id: "ac5", actor: "editor1", action: "PDF آپلود کرد", target: "قانون اساسی", at: "۱۴۰۴/۰۵/۰۵ ۱۱:۳۰", type: "content" },
  { id: "ac6", actor: "admin", action: "تنظیمات ظاهری را تغییر داد", target: "رنگ‌ها", at: "۱۴۰۴/۰۵/۰۴ ۱۷:۲۰", type: "settings" },
  { id: "ac7", actor: "admin", action: "صفحه حریم خصوصی را به‌روز کرد", target: "/privacy", at: "۱۴۰۴/۰۵/۰۴ ۱۰:۰۰", type: "content" },
];

export interface AdminNotification {
  id: string;
  title: string;
  desc: string;
  at: string;
  read: boolean;
  type: "info" | "warning" | "success" | "danger";
}

export const defaultNotifications: AdminNotification[] = [
  { id: "n1", title: "قانون جدید منتشر شد", desc: "قانون حمایت تکمیلی از خانواده (۱۴۰۳) به پایگاه اضافه شد.", at: "۲ ساعت پیش", read: false, type: "success" },
  { id: "n2", title: "تیکت با اولویت بالا", desc: "تیکت TK-1003 نیاز به پاسخ فوری دارد.", at: "۵ ساعت پیش", read: false, type: "warning" },
  { id: "n3", title: "پشتیبان‌گیری انجام شد", desc: "پشتیبان‌گیری روزانه پایگاه داده با موفقیت انجام شد.", at: "۸ ساعت پیش", read: true, type: "info" },
  { id: "n4", title: "خطای دسترسی‌پذیری", desc: "گزارش خطا در صفحه جستجوی پیشرفته.", at: "۱ روز پیش", read: true, type: "danger" },
];

/* ───────────────────────────────────────────────────────────────────────
   Analytics (charts)
   ─────────────────────────────────────────────────────────────────────── */

export const monthlyVisits = [
  { month: "فروردین", visits: 48200, laws: 312 },
  { month: "اردیبهشت", visits: 52800, laws: 348 },
  { month: "خرداد", visits: 61500, laws: 401 },
  { month: "تیر", visits: 58900, laws: 372 },
  { month: "مرداد", visits: 64200, laws: 425 },
  { month: "شهریور", visits: 71800, laws: 489 },
];

export const lawTypeDistribution = [
  { name: "قانون عادی", value: 62, color: "#d4a574" },
  { name: "آیین‌نامه", value: 18, color: "#4a6c8a" },
  { name: "بخشنامه", value: 9, color: "#4a7c4a" },
  { name: "قانون اساسی", value: 4, color: "#7a5c8a" },
  { name: "مقررات", value: 7, color: "#c08a3e" },
];

export const topSearchedLaws = [
  { title: "قانون مدنی", searches: 12450 },
  { title: "قانون مجازات اسلامی", searches: 9870 },
  { title: "قانون کار", searches: 8230 },
  { title: "قانون تجارت", searches: 6540 },
  { title: "قانون اساسی", searches: 5210 },
];

/* ───────────────────────────────────────────────────────────────────────
   Helpers — get a Law list for admin tables
   ─────────────────────────────────────────────────────────────────────── */

export interface AdminLawListItem {
  id: string;
  title: string;
  shortTitle?: string;
  type: LawType;
  year: number;
  number?: string;
  status: LawStatus;
  subject: string;
  articlesCount: number;
  amendmentsCount: number;
  referencesCount: number;
  pdfsCount: number;
  lastRevision: string;
}

export function getAdminLawList(): AdminLawListItem[] {
  return laws.map((l) => ({
    id: l.id,
    title: l.title,
    shortTitle: l.shortTitle,
    type: l.type,
    year: l.year,
    number: l.number,
    status: l.status,
    subject: l.subject,
    articlesCount: l.articles.length,
    amendmentsCount: l.amendments.length,
    referencesCount: l.references.length,
    pdfsCount: defaultLawPdfs.filter((p) => p.lawId === l.id).length,
    lastRevision: l.lastRevisionDate,
  }));
}

export function getLawByIdForAdmin(id: string): Law | undefined {
  return laws.find((l) => l.id === id);
}

export function getAllReferencedLawTitles() {
  return referencedLawTitles;
}

export const siteStats = {
  totalLaws: laws.length,
  inForce: laws.filter((l) => l.status === "in-force").length,
  amended: laws.filter((l) => l.status === "amended").length,
  revoked: laws.filter((l) => l.status === "revoked").length,
  pending: laws.filter((l) => l.status === "pending").length,
  totalArticles: laws.reduce((sum, l) => sum + l.articles.length, 0),
  totalAmendments: laws.reduce((sum, l) => sum + l.amendments.length, 0),
  totalReferences: laws.reduce((sum, l) => sum + l.references.length, 0),
  totalPdfs: defaultLawPdfs.length,
  totalUsers: defaultEndUsers.length,
  totalAdmins: defaultAdminUsers.length,
  totalBookmarks: defaultAdminBookmarks.length,
  openTickets: defaultAdminTickets.filter((t) => t.status === "open").length,
  totalPurchases: defaultAdminPurchases.length,
};
