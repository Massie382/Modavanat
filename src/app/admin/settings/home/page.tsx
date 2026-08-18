"use client";

import { PageHead, Card, Field, Switch, Notice } from "@/components/admin/primitives";
import { useToast } from "@/hooks/use-toast";
import { useAdminSettings } from "@/hooks/use-admin-settings";
import { faNum } from "@/components/admin/primitives";

// Phase 7 — wired to /api/admin/settings?key=home.
interface HomeSettings {
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
  sectionsVisible: { hero: boolean; decades: boolean; featured: boolean; recentAmendments: boolean };
}

const defaults: HomeSettings = {
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
  featuredLawIds: [],
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
  const { data, setData, loading, error, saving, save } =
    useAdminSettings<HomeSettings>("home", defaults);

  const onSave = async () => {
    const ok = await save();
    toast({
      title: ok ? "ذخیره شد" : "خطا",
      description: ok ? "تنظیمات صفحه نخست ذخیره شد." : error ?? "خطا در ذخیره",
    });
  };

  return (
    <div className="admin-stack">
      <PageHead
        title="تنظیمات صفحه نخست"
        subtitle="بخش‌های hero، قوانین منتخب، آمار و ابزارها"
        actions={
          <button
            className="admin-btn admin-btn-primary"
            onClick={onSave}
            disabled={saving || loading}
          >
            {saving ? "در حال ذخیره…" : "ذخیره"}
          </button>
        }
      />
      {loading && <Notice variant="info">در حال بارگذاری…</Notice>}
      {error && <Notice variant="danger">خطا: {error}</Notice>}

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
              <Switch
                on={data.sectionsVisible[k]}
                onChange={(v) =>
                  setData({ ...data, sectionsVisible: { ...data.sectionsVisible, [k]: v } })
                }
              />
            </div>
          ))}
        </div>
      </Card>

      <Card title="بخش Hero">
        <Field label="عنوان کوچک (Eyebrow)">
          <input
            className="admin-input"
            value={data.heroEyebrow}
            onChange={(e) => setData({ ...data, heroEyebrow: e.target.value })}
          />
        </Field>
        <div className="admin-grid-2">
          <Field label="خط اول تیتر">
            <input
              className="admin-input"
              value={data.heroHeadlineLine1}
              onChange={(e) => setData({ ...data, heroHeadlineLine1: e.target.value })}
            />
          </Field>
          <Field label="خط دوم تیتر">
            <input
              className="admin-input"
              value={data.heroHeadlineLine2}
              onChange={(e) => setData({ ...data, heroHeadlineLine2: e.target.value })}
            />
          </Field>
        </div>
        <Field label="متن معرفی">
          <textarea
            className="admin-textarea"
            rows={3}
            value={data.heroIntro}
            onChange={(e) => setData({ ...data, heroIntro: e.target.value })}
          />
        </Field>
        <div className="admin-grid-3">
          <Field label="برچسب فیلد عنوان">
            <input
              className="admin-input"
              value={data.searchTitleLabel}
              onChange={(e) => setData({ ...data, searchTitleLabel: e.target.value })}
            />
          </Field>
          <Field label="راهنمای فیلد عنوان">
            <input
              className="admin-input"
              value={data.searchTitlePlaceholder}
              onChange={(e) => setData({ ...data, searchTitlePlaceholder: e.target.value })}
            />
          </Field>
          <Field label="برچسب فیلد سال">
            <input
              className="admin-input"
              value={data.searchYearLabel}
              onChange={(e) => setData({ ...data, searchYearLabel: e.target.value })}
            />
          </Field>
        </div>
        <Field label="متن راهنمای کیبورد">
          <input
            className="admin-input"
            value={data.keyboardHint}
            onChange={(e) => setData({ ...data, keyboardHint: e.target.value })}
          />
        </Field>
      </Card>

      <Card title="قوانین منتخب">
        <div className="admin-grid-2">
          <Field label="تعداد قوانین نمایش‌داده‌شده">
            <input
              className="admin-input"
              type="number"
              dir="ltr"
              value={data.featuredLawsCount}
              onChange={(e) =>
                setData({ ...data, featuredLawsCount: Number(e.target.value) || 0 })
              }
            />
          </Field>
          <Field label="عنوان بخش">
            <input
              className="admin-input"
              value={data.featuredLawsTitle}
              onChange={(e) => setData({ ...data, featuredLawsTitle: e.target.value })}
            />
          </Field>
        </div>
        <Field
          label="شناسه‌های قوانین منتخب"
          hint="با کاما جدا کنید (مثلاً q-madani-1307, q-asasi-1358)"
        >
          <input
            className="admin-input admin-mono"
            dir="ltr"
            value={data.featuredLawIds.join(", ")}
            onChange={(e) =>
              setData({
                ...data,
                featuredLawIds: e.target.value
                  .split(/[،,]/)
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
        </Field>
      </Card>

      <Card title="آمار سایت" desc="۵ عدد نمایش‌داده‌شده در ستون کناری">
        <div className="admin-grid-2">
          {data.siteStats.map((s, i) => (
            <Field key={i} label={s.label}>
              <input
                className="admin-input"
                dir="ltr"
                value={s.value}
                onChange={(e) => {
                  const next = [...data.siteStats];
                  next[i] = { ...s, value: e.target.value };
                  setData({ ...data, siteStats: next });
                }}
              />
            </Field>
          ))}
        </div>
      </Card>

      <Card title="ابزارها" desc="ابزارهای نمایش‌داده‌شده در ستون کناری">
        <table className="admin-table">
          <thead>
            <tr>
              <th>برچسب</th>
              <th>آدرس</th>
              <th className="col-narrow">نمایش</th>
            </tr>
          </thead>
          <tbody>
            {data.tools.map((t, i) => (
              <tr key={t.id}>
                <td>
                  <input
                    className="admin-input admin-input-sm"
                    value={t.label}
                    onChange={(e) => {
                      const next = [...data.tools];
                      next[i] = { ...t, label: e.target.value };
                      setData({ ...data, tools: next });
                    }}
                  />
                </td>
                <td>
                  <input
                    className="admin-input admin-input-sm admin-mono"
                    dir="ltr"
                    value={t.href}
                    onChange={(e) => {
                      const next = [...data.tools];
                      next[i] = { ...t, href: e.target.value };
                      setData({ ...data, tools: next });
                    }}
                  />
                </td>
                <td className="col-narrow">
                  <Switch
                    on={t.visible}
                    onChange={(v) => {
                      const next = [...data.tools];
                      next[i] = { ...t, visible: v };
                      setData({ ...data, tools: next });
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="بخش «برای حقوق‌دانان»">
        <Field label="عنوان">
          <input
            className="admin-input"
            value={data.forLawyersTitle}
            onChange={(e) => setData({ ...data, forLawyersTitle: e.target.value })}
          />
        </Field>
        <Field label="متن">
          <textarea
            className="admin-textarea"
            rows={2}
            value={data.forLawyersText}
            onChange={(e) => setData({ ...data, forLawyersText: e.target.value })}
          />
        </Field>
        <Field label="آدرس پیوند">
          <input
            className="admin-input admin-mono"
            dir="ltr"
            value={data.forLawyersHref}
            onChange={(e) => setData({ ...data, forLawyersHref: e.target.value })}
          />
        </Field>
      </Card>

      <Card title="اصلاحات اخیر">
        <Field label="عنوان بخش">
          <input
            className="admin-input"
            value={data.recentAmendmentsTitle}
            onChange={(e) => setData({ ...data, recentAmendmentsTitle: e.target.value })}
          />
        </Field>
        <Field label="تعداد در هر صفحه">
          <input
            className="admin-input"
            type="number"
            dir="ltr"
            value={data.recentAmendmentsPageSize}
            onChange={(e) =>
              setData({ ...data, recentAmendmentsPageSize: Number(e.target.value) || 0 })
            }
          />
        </Field>
      </Card>

      <div className="admin-muted" style={{ textAlign: "center", padding: "1rem" }}>
        {faNum(data.featuredLawsCount)} قانون منتخب
      </div>
    </div>
  );
}
