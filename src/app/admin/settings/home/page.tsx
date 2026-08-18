"use client";

import { PageHead, Card, Field, Switch, Notice } from "@/components/admin/primitives";
import { useToast } from "@/hooks/use-toast";
import { faNum } from "@/components/admin/primitives";

// Phase 7 — frontend only. Home-page settings will be persisted via
// /api/admin/settings?key=home (scaffolded) but the form below is not
// yet wired to read/write that endpoint.
const homeSettingsMock = {
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
  featuredLawIds: [] as string[],
  recentAmendmentsTitle: "اصلاحات اخیر",
  recentAmendmentsPageSize: 8,
  siteStats: [
    { label: "کل قوانین", value: "—" },
    { label: "لازم‌الاجرا", value: "—" },
    { label: "منسوخ", value: "—" },
    { label: "اصلاحات ثبت‌شده", value: "—" },
    { label: "ارجاعات متقابل", value: "—" },
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

export default function HomeSettingsPage() {
  const { toast } = useToast();
  return (
    <div className="admin-stack">
      <PageHead title="تنظیمات صفحه نخست" subtitle="بخش‌های hero، قوانین منتخب، آمار و ابزارها" actions={<button className="admin-btn admin-btn-primary" onClick={() => toast({ title: "اطلاع", description: "ذخیره در فاز ۷." })}>ذخیره</button>} />

      <Notice variant="warning">Phase 7 — frontend only. انتخاب قوانین منتخب نیاز به اتصال به /api/laws دارد.</Notice>

      <Card title="نمایش بخش‌ها">
        <div className="admin-grid-2">
          {([
            ["hero", "بخش جستجوی اصلی"],
            ["decades", "مرور بر اساس دهه"],
            ["featured", "قوانین منتخب"],
            ["recentAmendments", "اصلاحات اخیر"],
          ] as const).map(([k, label]) => (
            <div key={k} className="admin-row-between" style={{ padding: "0.5rem 0" }}>
              <span style={{ fontSize: 13 }}>{label}</span>
              <Switch on={homeSettingsMock.sectionsVisible[k]} onChange={() => {}} />
            </div>
          ))}
        </div>
      </Card>

      <Card title="بخش Hero">
        <Field label="عنوان کوچک (Eyebrow)"><input className="admin-input" defaultValue={homeSettingsMock.heroEyebrow} /></Field>
        <div className="admin-grid-2">
          <Field label="خط اول تیتر"><input className="admin-input" defaultValue={homeSettingsMock.heroHeadlineLine1} /></Field>
          <Field label="خط دوم تیتر"><input className="admin-input" defaultValue={homeSettingsMock.heroHeadlineLine2} /></Field>
        </div>
        <Field label="متن معرفی"><textarea className="admin-textarea" defaultValue={homeSettingsMock.heroIntro} rows={3} /></Field>
        <div className="admin-grid-3">
          <Field label="برچسب فیلد عنوان"><input className="admin-input" defaultValue={homeSettingsMock.searchTitleLabel} /></Field>
          <Field label="راهنمای فیلد عنوان"><input className="admin-input" defaultValue={homeSettingsMock.searchTitlePlaceholder} /></Field>
          <Field label="برچسب فیلد سال"><input className="admin-input" defaultValue={homeSettingsMock.searchYearLabel} /></Field>
        </div>
        <Field label="متن راهنمای کیبورد"><input className="admin-input" defaultValue={homeSettingsMock.keyboardHint} /></Field>
      </Card>

      <Card title="قوانین منتخب">
        <div className="admin-grid-2">
          <Field label="تعداد قوانین نمایش‌داده‌شده"><input className="admin-input" type="number" defaultValue={homeSettingsMock.featuredLawsCount} dir="ltr" /></Field>
          <Field label="عنوان بخش"><input className="admin-input" defaultValue={homeSettingsMock.featuredLawsTitle} /></Field>
        </div>
        <Field label="انتخاب دستی قوانین منتخب" hint="در فاز ۷ به /api/laws متصل خواهد شد">
          <div className="admin-muted" style={{ padding: "1rem", border: "1px solid var(--admin-border)", borderRadius: 4, textAlign: "center" }}>
            فهرست قوانین در فاز ۷ بارگذاری خواهد شد.
          </div>
        </Field>
      </Card>

      <Card title="آمار سایت" desc="۵ عدد نمایش‌داده‌شده در ستون کناری">
        <div className="admin-grid-2">
          {homeSettingsMock.siteStats.map((s, i) => (
            <Field key={i} label={s.label}><input className="admin-input" defaultValue={s.value} dir="ltr" /></Field>
          ))}
        </div>
      </Card>

      <Card title="ابزارها" desc="ابزارهای نمایش‌داده‌شده در ستون کناری">
        <table className="admin-table">
          <thead><tr><th>برچسب</th><th>آدرس</th><th className="col-narrow">نمایش</th><th className="col-narrow">عمل</th></tr></thead>
          <tbody>
            {homeSettingsMock.tools.map((t) => (
              <tr key={t.id}>
                <td><input className="admin-input admin-input-sm" defaultValue={t.label} /></td>
                <td><input className="admin-input admin-input-sm admin-mono" dir="ltr" defaultValue={t.href} /></td>
                <td className="col-narrow"><Switch on={t.visible} onChange={() => {}} /></td>
                <td className="col-narrow"><button className="admin-btn admin-btn-sm admin-btn-ghost">حذف</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="بخش «برای حقوق‌دانان»">
        <Field label="عنوان"><input className="admin-input" defaultValue={homeSettingsMock.forLawyersTitle} /></Field>
        <Field label="متن"><textarea className="admin-textarea" defaultValue={homeSettingsMock.forLawyersText} rows={2} /></Field>
        <Field label="آدرس پیوند"><input className="admin-input admin-mono" dir="ltr" defaultValue={homeSettingsMock.forLawyersHref} /></Field>
      </Card>

      <Card title="اصلاحات اخیر">
        <Field label="عنوان بخش"><input className="admin-input" defaultValue={homeSettingsMock.recentAmendmentsTitle} /></Field>
        <Field label="تعداد در هر صفحه"><input className="admin-input" type="number" defaultValue={homeSettingsMock.recentAmendmentsPageSize} dir="ltr" /></Field>
      </Card>

      <div className="admin-muted" style={{ textAlign: "center", padding: "1rem" }}>
        {faNum(homeSettingsMock.featuredLawsCount)} قانون منتخب
      </div>
    </div>
  );
}
