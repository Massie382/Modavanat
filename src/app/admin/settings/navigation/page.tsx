"use client";

import { PageHead, Card, Field, Switch, Notice } from "@/components/admin/primitives";
import { useToast } from "@/hooks/use-toast";
import { useAdminSettings } from "@/hooks/use-admin-settings";

// Phase 7 — wired to /api/admin/settings?key=navigation.
interface NavLink {
  id: string;
  label: string;
  href: string;
  visible: boolean;
}
interface FooterColumn {
  id: string;
  title: string;
  links: NavLink[];
}
interface AuthLinks {
  signinLabel: string;
  signupLabel: string;
  signinHref: string;
  signupHref: string;
}
interface NavigationSettings {
  topStripLinks: NavLink[];
  primaryNav: NavLink[];
  footerColumns: FooterColumn[];
  authLinks: AuthLinks;
  searchPlaceholder: string;
}

const defaults: NavigationSettings = {
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
  const { data, setData, loading, error, saving, save } =
    useAdminSettings<NavigationSettings>("navigation", defaults);

  const onSave = async () => {
    const ok = await save();
    toast({
      title: ok ? "ذخیره شد" : "خطا",
      description: ok ? "تنظیمات ناوبری ذخیره شد." : error ?? "خطا در ذخیره",
    });
  };

  return (
    <div className="admin-stack">
      <PageHead
        title="فهرست‌ها و ناوبری"
        subtitle="مدیریت پیوندهای ناوبری در سرصفحه، پاصفحه و صفحات احراز هویت"
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

      <Card title="نوار بالایی سرصفحه" desc="پیوندهای کمکی در نوار باریک بالای سرصفحه">
        <NavList
          items={data.topStripLinks}
          onChange={(items) => setData({ ...data, topStripLinks: items })}
        />
      </Card>

      <Card title="ناوبری اصلی" desc="۴ مورد اصلی در نوار زغالی سرصفحه">
        <NavList
          items={data.primaryNav}
          onChange={(items) => setData({ ...data, primaryNav: items })}
        />
      </Card>

      <Card title="پیوندهای احراز هویت" desc="متن و آدرس دکمه‌های ورود/ثبت‌نام">
        <div className="admin-grid-2">
          <Field label="متن دکمه ورود">
            <input
              className="admin-input"
              value={data.authLinks.signinLabel}
              onChange={(e) =>
                setData({
                  ...data,
                  authLinks: { ...data.authLinks, signinLabel: e.target.value },
                })
              }
            />
          </Field>
          <Field label="آدرس ورود">
            <input
              className="admin-input admin-mono"
              dir="ltr"
              value={data.authLinks.signinHref}
              onChange={(e) =>
                setData({
                  ...data,
                  authLinks: { ...data.authLinks, signinHref: e.target.value },
                })
              }
            />
          </Field>
          <Field label="متن دکمه ثبت‌نام">
            <input
              className="admin-input"
              value={data.authLinks.signupLabel}
              onChange={(e) =>
                setData({
                  ...data,
                  authLinks: { ...data.authLinks, signupLabel: e.target.value },
                })
              }
            />
          </Field>
          <Field label="آدرس ثبت‌نام">
            <input
              className="admin-input admin-mono"
              dir="ltr"
              value={data.authLinks.signupHref}
              onChange={(e) =>
                setData({
                  ...data,
                  authLinks: { ...data.authLinks, signupHref: e.target.value },
                })
              }
            />
          </Field>
        </div>
      </Card>

      <Card title="جستجوی سرصفحه">
        <Field label="متن راهنمای جستجو">
          <input
            className="admin-input"
            value={data.searchPlaceholder}
            onChange={(e) => setData({ ...data, searchPlaceholder: e.target.value })}
          />
        </Field>
      </Card>

      <Card title="ستون‌های پاصفحه" desc="۳ ستون با چند پیوند هر کدام">
        <div className="admin-grid-3">
          {data.footerColumns.map((col, ci) => (
            <div
              key={col.id}
              style={{ border: "1px solid var(--admin-border)", borderRadius: 4, padding: "0.75rem" }}
            >
              <Field label="عنوان ستون">
                <input
                  className="admin-input admin-input-sm"
                  value={col.title}
                  onChange={(e) => {
                    const next = [...data.footerColumns];
                    next[ci] = { ...col, title: e.target.value };
                    setData({ ...data, footerColumns: next });
                  }}
                />
              </Field>
              <div className="admin-stack-sm" style={{ marginTop: "0.5rem" }}>
                {col.links.map((l, li) => (
                  <div key={l.id} className="admin-row" style={{ fontSize: 11.5 }}>
                    <Switch
                      on={l.visible}
                      onChange={(v) => {
                        const next = [...data.footerColumns];
                        const links = [...col.links];
                        links[li] = { ...l, visible: v };
                        next[ci] = { ...col, links };
                        setData({ ...data, footerColumns: next });
                      }}
                    />
                    <input
                      className="admin-input admin-input-sm"
                      style={{ flex: 1 }}
                      value={l.label}
                      onChange={(e) => {
                        const next = [...data.footerColumns];
                        const links = [...col.links];
                        links[li] = { ...l, label: e.target.value };
                        next[ci] = { ...col, links };
                        setData({ ...data, footerColumns: next });
                      }}
                    />
                    <input
                      className="admin-input admin-input-sm admin-mono"
                      dir="ltr"
                      style={{ width: 120 }}
                      value={l.href}
                      onChange={(e) => {
                        const next = [...data.footerColumns];
                        const links = [...col.links];
                        links[li] = { ...l, href: e.target.value };
                        next[ci] = { ...col, links };
                        setData({ ...data, footerColumns: next });
                      }}
                    />
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

function NavList({
  items,
  onChange,
}: {
  items: NavLink[];
  onChange: (items: NavLink[]) => void;
}) {
  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th>متن</th>
          <th>آدرس</th>
          <th className="col-narrow">نمایش</th>
        </tr>
      </thead>
      <tbody>
        {items.map((l, i) => (
          <tr key={l.id}>
            <td>
              <input
                className="admin-input admin-input-sm"
                value={l.label}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...l, label: e.target.value };
                  onChange(next);
                }}
              />
            </td>
            <td>
              <input
                className="admin-input admin-input-sm admin-mono"
                dir="ltr"
                value={l.href}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...l, href: e.target.value };
                  onChange(next);
                }}
              />
            </td>
            <td className="col-narrow">
              <Switch
                on={l.visible}
                onChange={(v) => {
                  const next = [...items];
                  next[i] = { ...l, visible: v };
                  onChange(next);
                }}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
