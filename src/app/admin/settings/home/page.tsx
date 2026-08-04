"use client";

import { PageHead, Card, Field, Switch } from "@/components/admin/primitives";
import { defaultHomeSettings, getAdminLawList } from "@/lib/admin-data";
import { faNum } from "@/components/admin/primitives";

export default function HomeSettingsPage() {
  const laws = getAdminLawList();
  return (
    <div className="admin-stack">
      <PageHead title="تنظیمات صفحه نخست" subtitle="بخش‌های hero، قوانین منتخب، آمار و ابزارها" actions={<button className="admin-btn admin-btn-primary">ذخیره</button>} />

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
              <Switch on={defaultHomeSettings.sectionsVisible[k]} onChange={() => {}} />
            </div>
          ))}
        </div>
      </Card>

      <Card title="بخش Hero">
        <Field label="عنوان کوچک (Eyebrow)"><input className="admin-input" defaultValue={defaultHomeSettings.heroEyebrow} /></Field>
        <div className="admin-grid-2">
          <Field label="خط اول تیتر"><input className="admin-input" defaultValue={defaultHomeSettings.heroHeadlineLine1} /></Field>
          <Field label="خط دوم تیتر"><input className="admin-input" defaultValue={defaultHomeSettings.heroHeadlineLine2} /></Field>
        </div>
        <Field label="متن معرفی"><textarea className="admin-textarea" defaultValue={defaultHomeSettings.heroIntro} rows={3} /></Field>
        <div className="admin-grid-3">
          <Field label="برچسب فیلد عنوان"><input className="admin-input" defaultValue={defaultHomeSettings.searchTitleLabel} /></Field>
          <Field label="راهنمای فیلد عنوان"><input className="admin-input" defaultValue={defaultHomeSettings.searchTitlePlaceholder} /></Field>
          <Field label="برچسب فیلد سال"><input className="admin-input" defaultValue={defaultHomeSettings.searchYearLabel} /></Field>
        </div>
        <Field label="متن راهنمای کیبورد"><input className="admin-input" defaultValue={defaultHomeSettings.keyboardHint} /></Field>
      </Card>

      <Card title="قوانین منتخب">
        <div className="admin-grid-2">
          <Field label="تعداد قوانین نمایش‌داده‌شده"><input className="admin-input" type="number" defaultValue={defaultHomeSettings.featuredLawsCount} dir="ltr" /></Field>
          <Field label="عنوان بخش"><input className="admin-input" defaultValue={defaultHomeSettings.featuredLawsTitle} /></Field>
        </div>
        <Field label="انتخاب دستی قوانین منتخب" hint="در صورت انتخاب، فیلد تعداد نادیده گرفته می‌شود">
          <div className="admin-stack-sm" style={{ maxHeight: 200, overflowY: "auto", border: "1px solid var(--admin-border)", borderRadius: 4, padding: "0.5rem" }}>
            {laws.map((l) => (
              <label key={l.id} className="admin-row" style={{ cursor: "pointer", padding: "0.25rem 0" }}>
                <input type="checkbox" className="admin-check" defaultChecked={defaultHomeSettings.featuredLawIds.includes(l.id)} />
                <span style={{ flex: 1 }}>{l.title}</span>
                <span className="admin-muted">{faNum(l.year)}</span>
              </label>
            ))}
          </div>
        </Field>
      </Card>

      <Card title="آمار سایت" desc="۵ عدد نمایش‌داده‌شده در ستون کناری">
        <div className="admin-grid-2">
          {defaultHomeSettings.siteStats.map((s, i) => (
            <Field key={i} label={s.label}><input className="admin-input" defaultValue={s.value} dir="ltr" /></Field>
          ))}
        </div>
      </Card>

      <Card title="ابزارها" desc="ابزارهای نمایش‌داده‌شده در ستون کناری">
        <table className="admin-table">
          <thead><tr><th>برچسب</th><th>آدرس</th><th className="col-narrow">نمایش</th><th className="col-narrow">عمل</th></tr></thead>
          <tbody>
            {defaultHomeSettings.tools.map((t) => (
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
        <Field label="عنوان"><input className="admin-input" defaultValue={defaultHomeSettings.forLawyersTitle} /></Field>
        <Field label="متن"><textarea className="admin-textarea" defaultValue={defaultHomeSettings.forLawyersText} rows={2} /></Field>
        <Field label="آدرس پیوند"><input className="admin-input admin-mono" dir="ltr" defaultValue={defaultHomeSettings.forLawyersHref} /></Field>
      </Card>

      <Card title="اصلاحات اخیر">
        <Field label="عنوان بخش"><input className="admin-input" defaultValue={defaultHomeSettings.recentAmendmentsTitle} /></Field>
        <Field label="تعداد در هر صفحه"><input className="admin-input" type="number" defaultValue={defaultHomeSettings.recentAmendmentsPageSize} dir="ltr" /></Field>
      </Card>
    </div>
  );
}
