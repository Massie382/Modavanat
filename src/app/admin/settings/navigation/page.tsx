"use client";

import { PageHead, Card, Field, Badge, Switch, Notice } from "@/components/admin/primitives";
import { useToast } from "@/hooks/use-toast";

// Phase 7 — frontend only. Navigation settings will be persisted via
// /api/admin/settings?key=navigation (scaffolded) but the form below
// is not yet wired to read/write that endpoint.
const navigationMock = {
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

export default function NavigationSettingsPage() {
  const { toast } = useToast();
  return (
    <div className="admin-stack">
      <PageHead title="فهرست‌ها و ناوبری" subtitle="مدیریت پیوندهای ناوبری در سرصفحه، پاصفحه و صفحات احراز هویت" actions={<button className="admin-btn admin-btn-primary" onClick={() => toast({ title: "اطلاع", description: "ذخیره در فاز ۷." })}>ذخیره</button>} />

      <Notice variant="warning">Phase 7 — frontend only. ذخیره‌سازی ناوبری در فاز ۷ به /api/admin/settings وصل خواهد شد.</Notice>

      <Card title="نوار بالایی سرصفحه" desc="پیوندهای کمکی در نوار باریک بالای سرصفحه">
        <NavList items={navigationMock.topStripLinks} />
      </Card>

      <Card title="ناوبری اصلی" desc="۴ مورد اصلی در نوار زغالی سرصفحه">
        <NavList items={navigationMock.primaryNav} />
      </Card>

      <Card title="پیوندهای احراز هویت" desc="متن و آدرس دکمه‌های ورود/ثبت‌نام">
        <div className="admin-grid-2">
          <Field label="متن دکمه ورود"><input className="admin-input" defaultValue={navigationMock.authLinks.signinLabel} /></Field>
          <Field label="آدرس ورود"><input className="admin-input admin-mono" dir="ltr" defaultValue={navigationMock.authLinks.signinHref} /></Field>
          <Field label="متن دکمه ثبت‌نام"><input className="admin-input" defaultValue={navigationMock.authLinks.signupLabel} /></Field>
          <Field label="آدرس ثبت‌نام"><input className="admin-input admin-mono" dir="ltr" defaultValue={navigationMock.authLinks.signupHref} /></Field>
        </div>
      </Card>

      <Card title="جستجوی سرصفحه">
        <Field label="متن راهنمای جستجو"><input className="admin-input" defaultValue={navigationMock.searchPlaceholder} /></Field>
      </Card>

      <Card title="ستون‌های پاصفحه" desc="۳ ستون با چند پیوند هر کدام">
        <div className="admin-grid-3">
          {navigationMock.footerColumns.map((col) => (
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

function NavList({ items }: { items: typeof navigationMock.topStripLinks }) {
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
