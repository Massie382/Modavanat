"use client";

import { PageHead, Card, Field, Badge, Switch } from "@/components/admin/primitives";
import { useToast } from "@/hooks/use-toast";
import { defaultNavigation } from "@/lib/admin-data";

export default function NavigationSettingsPage() {
  const { toast } = useToast();
  return (
    <div className="admin-stack">
      <PageHead title="فهرست‌ها و ناوبری" subtitle="مدیریت پیوندهای ناوبری در سرصفحه، پاصفحه و صفحات احراز هویت" actions={<button className="admin-btn admin-btn-primary" onClick={() => toast({ title: "ذخیره شد", description: "تنظیمات با موفقیت ثبت شد." })}>ذخیره</button>} />

      <Card title="نوار بالایی سرصفحه" desc="پیوندهای کمکی در نوار باریک بالای سرصفحه">
        <NavList items={defaultNavigation.topStripLinks} />
      </Card>

      <Card title="ناوبری اصلی" desc="۴ مورد اصلی در نوار زغالی سرصفحه">
        <NavList items={defaultNavigation.primaryNav} />
      </Card>

      <Card title="پیوندهای احراز هویت" desc="متن و آدرس دکمه‌های ورود/ثبت‌نام">
        <div className="admin-grid-2">
          <Field label="متن دکمه ورود"><input className="admin-input" defaultValue={defaultNavigation.authLinks.signinLabel} /></Field>
          <Field label="آدرس ورود"><input className="admin-input admin-mono" dir="ltr" defaultValue={defaultNavigation.authLinks.signinHref} /></Field>
          <Field label="متن دکمه ثبت‌نام"><input className="admin-input" defaultValue={defaultNavigation.authLinks.signupLabel} /></Field>
          <Field label="آدرس ثبت‌نام"><input className="admin-input admin-mono" dir="ltr" defaultValue={defaultNavigation.authLinks.signupHref} /></Field>
        </div>
      </Card>

      <Card title="جستجوی سرصفحه">
        <Field label="متن راهنمای جستجو"><input className="admin-input" defaultValue={defaultNavigation.searchPlaceholder} /></Field>
      </Card>

      <Card title="ستون‌های پاصفحه" desc="۳ ستون با ۵ پیوند هر کدام">
        <div className="admin-grid-3">
          {defaultNavigation.footerColumns.map((col) => (
            <div key={col.id} style={{ border: "1px solid var(--admin-border)", borderRadius: 4, padding: "0.75rem" }}>
              <Field label="عنوان ستون"><input className="admin-input admin-input-sm" defaultValue={col.title} /></Field>
              <div className="admin-stack-sm" style={{ marginTop: "0.5rem" }}>
                {col.links.map((l) => (
                  <div key={l.id} className="admin-row" style={{ fontSize: 11.5 }}>
                    <Switch on={l.visible} onChange={() => {}} />
                    <span style={{ flex: 1 }}>{l.label}</span>
                    <code className="admin-mono admin-muted" dir="ltr">{l.href}</code>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function NavList({ items }: { items: typeof defaultNavigation.topStripLinks }) {
  return (
    <table className="admin-table">
      <thead><tr><th>متن</th><th>آدرس</th><th className="col-narrow">نمایش</th><th className="col-narrow">عمل</th></tr></thead>
      <tbody>
        {items.map((l) => (
          <tr key={l.id}>
            <td><input className="admin-input admin-input-sm" defaultValue={l.label} /></td>
            <td><input className="admin-input admin-input-sm admin-mono" dir="ltr" defaultValue={l.href} /></td>
            <td className="col-narrow"><Switch on={l.visible} onChange={() => {}} /></td>
            <td className="col-narrow">
              <button className="admin-btn admin-btn-sm admin-btn-ghost">↑</button>
              <button className="admin-btn admin-btn-sm admin-btn-ghost">↓</button>
              <button className="admin-btn admin-btn-sm admin-btn-ghost">حذف</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
