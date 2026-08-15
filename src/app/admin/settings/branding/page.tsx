"use client";

import { useState } from "react";
import { PageHead, Card, Field, Switch, Tabs, Badge } from "@/components/admin/primitives";
import { useToast } from "@/hooks/use-toast";
import { defaultBranding } from "@/lib/admin-data";

export default function BrandingSettingsPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState("identity");
  return (
    <>
      <PageHead title="نام و نشان" subtitle="هویت بصری برند، لوگوها و اطلاعات پایه" actions={<button className="admin-btn admin-btn-primary" onClick={() => toast({ title: "ذخیره شد", description: "تنظیمات با موفقیت ثبت شد." })}>ذخیره</button>} />
      <Tabs tabs={[{ id: "identity", label: "هویت" }, { id: "logos", label: "لوگوها" }, { id: "header", label: "سرصفحه" }, { id: "footer", label: "پاصفحه" }, { id: "contact", label: "اطلاعات تماس" }]} active={tab} onChange={setTab} />

      {tab === "identity" && (
        <div className="admin-grid-2">
          <Card title="نام و توضیحات">
            <Field label="نام سایت"><input className="admin-input" defaultValue={defaultBranding.siteName} /></Field>
            <Field label="شعار (Tagline)"><input className="admin-input" defaultValue={defaultBranding.tagline} /></Field>
            <Field label="توضیحات کوتاه"><textarea className="admin-textarea" defaultValue={defaultBranding.description} rows={3} /></Field>
            <div className="admin-grid-2">
              <Field label="نسخه"><input className="admin-input" defaultValue={defaultBranding.version} /></Field>
              <Field label="آخرین به‌روزرسانی"><input className="admin-input" defaultValue={defaultBranding.lastUpdated} dir="ltr" /></Field>
            </div>
          </Card>
        </div>
      )}

      {tab === "logos" && (
        <div className="admin-stack">
          <Card title="لوگوها" desc="تصاویر برند در حالت‌های مختلف">
            <div className="admin-grid-3">
              {([
                { key: "light", label: "لوگوی روشن (سرصفحه)", val: defaultBranding.logos.light },
                { key: "dark", label: "لوگوی تیره (پاصفحه)", val: defaultBranding.logos.dark },
                { key: "account", label: "لوگوی پنل کاربری", val: defaultBranding.logos.account },
                { key: "favicon", label: "Favicon", val: defaultBranding.logos.favicon || "(بدون)" },
                { key: "ogImage", label: "تصویر OpenGraph", val: defaultBranding.logos.ogImage || "(بدون)" },
                { key: "appleTouchIcon", label: "Apple Touch Icon", val: defaultBranding.logos.appleTouchIcon || "(بدون)" },
              ] as const).map((l) => (
                <div key={l.key} style={{ border: "1px solid var(--admin-border)", borderRadius: 4, padding: "0.75rem", textAlign: "center" }}>
                  <div style={{ height: 80, display: "grid", placeItems: "center", backgroundColor: "var(--admin-surface-sunken)", borderRadius: 4, marginBottom: "0.5rem" }}>
                    {l.val && l.val !== "(بدون)" ? <span className="admin-muted">تصویر</span> : <span className="admin-muted">آپلود نشده</span>}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 500, marginBottom: "0.25rem" }}>{l.label}</div>
                  <code className="admin-mono admin-muted" dir="ltr" style={{ display: "block", marginBottom: "0.5rem", fontSize: 10 }}>{l.val}</code>
                  <button className="admin-btn admin-btn-sm admin-btn-ghost">آپلود</button>
                </div>
              ))}
            </div>
          </Card>
          <Card title="ابعاد لوگو">
            <div className="admin-grid-2">
              <Field label="عرض (px)"><input className="admin-input" type="number" defaultValue={defaultBranding.logoDimensions.width} dir="ltr" /></Field>
              <Field label="ارتفاع (px)"><input className="admin-input" type="number" defaultValue={defaultBranding.logoDimensions.height} dir="ltr" /></Field>
            </div>
          </Card>
        </div>
      )}

      {tab === "header" && (
        <Card title="تنظیمات سرصفحه">
          <div className="admin-grid-2">
            <Field label="ارتفاع سرصفحه - دسکتاپ (px)"><input className="admin-input" type="number" defaultValue={defaultBranding.headerHeightDesktop} dir="ltr" /></Field>
            <Field label="ارتفاع سرصفحه - موبایل (px)"><input className="admin-input" type="number" defaultValue={defaultBranding.headerHeightMobile} dir="ltr" /></Field>
          </div>
          <Field label="حداکثر عرض محتوا (px)"><input className="admin-input" type="number" defaultValue={defaultBranding.containerMaxWidth} dir="ltr" /></Field>
        </Card>
      )}

      {tab === "footer" && (
        <Card title="تنظیمات پاصفحه">
          <Field label="متن معرفی برند"><textarea className="admin-textarea" defaultValue={defaultBranding.footerBlurb} rows={4} /></Field>
          <Field label="متن کپی‌رایت"><input className="admin-input" defaultValue={defaultBranding.copyrightText} /></Field>
          <Field label="نشانی گزارش خطا"><input className="admin-input" dir="ltr" defaultValue={defaultBranding.errorReportUrl} /></Field>
        </Card>
      )}

      {tab === "contact" && (
        <Card title="اطلاعات تماس پایه">
          <Field label="نشانی پستی"><textarea className="admin-textarea" defaultValue={defaultBranding.postalAddress} rows={2} /></Field>
          <Field label="کد پستی"><input className="admin-input" dir="ltr" defaultValue={defaultBranding.postalCode} /></Field>
        </Card>
      )}
    </>
  );
}
