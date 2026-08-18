"use client";

import { useState } from "react";
import { PageHead, Card, Field, Switch, Tabs, Badge, Notice } from "@/components/admin/primitives";
import { useToast } from "@/hooks/use-toast";

// Phase 7 — frontend only. Branding settings are persisted via
// /api/admin/settings?key=branding (scaffolded) but the form below
// is not yet wired to read/write that endpoint. Values are inlined
// so the page renders without depending on the old mock module.
const brandingMock = {
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

export default function BrandingSettingsPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState("identity");
  return (
    <>
      <PageHead title="نام و نشان" subtitle="هویت بصری برند، لوگوها و اطلاعات پایه" actions={<button className="admin-btn admin-btn-primary" onClick={() => toast({ title: "اطلاع", description: "ذخیره در فاز ۷ پیاده‌سازی خواهد شد." })}>ذخیره</button>} />
      <Notice variant="warning">Phase 7 — frontend only. ذخیره‌سازی تنظیمات در فاز ۷ به /api/admin/settings وصل خواهد شد.</Notice>
      <Tabs tabs={[{ id: "identity", label: "هویت" }, { id: "logos", label: "لوگوها" }, { id: "header", label: "سرصفحه" }, { id: "footer", label: "پاصفحه" }, { id: "contact", label: "اطلاعات تماس" }]} active={tab} onChange={setTab} />

      {tab === "identity" && (
        <div className="admin-grid-2">
          <Card title="نام و توضیحات">
            <Field label="نام سایت"><input className="admin-input" defaultValue={brandingMock.siteName} /></Field>
            <Field label="شعار (Tagline)"><input className="admin-input" defaultValue={brandingMock.tagline} /></Field>
            <Field label="توضیحات کوتاه"><textarea className="admin-textarea" defaultValue={brandingMock.description} rows={3} /></Field>
            <div className="admin-grid-2">
              <Field label="نسخه"><input className="admin-input" defaultValue={brandingMock.version} /></Field>
              <Field label="آخرین به‌روزرسانی"><input className="admin-input" defaultValue={brandingMock.lastUpdated} dir="ltr" /></Field>
            </div>
          </Card>
        </div>
      )}

      {tab === "logos" && (
        <div className="admin-stack">
          <Card title="لوگوها" desc="تصاویر برند در حالت‌های مختلف">
            <div className="admin-grid-3">
              {([
                { key: "light", label: "لوگوی روشن (سرصفحه)", val: brandingMock.logos.light },
                { key: "dark", label: "لوگوی تیره (پاصفحه)", val: brandingMock.logos.dark },
                { key: "account", label: "لوگوی پنل کاربری", val: brandingMock.logos.account },
                { key: "favicon", label: "Favicon", val: brandingMock.logos.favicon || "(بدون)" },
                { key: "ogImage", label: "تصویر OpenGraph", val: brandingMock.logos.ogImage || "(بدون)" },
                { key: "appleTouchIcon", label: "Apple Touch Icon", val: brandingMock.logos.appleTouchIcon || "(بدون)" },
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
              <Field label="عرض (px)"><input className="admin-input" type="number" defaultValue={brandingMock.logoDimensions.width} dir="ltr" /></Field>
              <Field label="ارتفاع (px)"><input className="admin-input" type="number" defaultValue={brandingMock.logoDimensions.height} dir="ltr" /></Field>
            </div>
          </Card>
        </div>
      )}

      {tab === "header" && (
        <Card title="تنظیمات سرصفحه">
          <div className="admin-grid-2">
            <Field label="ارتفاع سرصفحه - دسکتاپ (px)"><input className="admin-input" type="number" defaultValue={brandingMock.headerHeightDesktop} dir="ltr" /></Field>
            <Field label="ارتفاع سرصفحه - موبایل (px)"><input className="admin-input" type="number" defaultValue={brandingMock.headerHeightMobile} dir="ltr" /></Field>
          </div>
          <Field label="حداکثر عرض محتوا (px)"><input className="admin-input" type="number" defaultValue={brandingMock.containerMaxWidth} dir="ltr" /></Field>
        </Card>
      )}

      {tab === "footer" && (
        <Card title="تنظیمات پاصفحه">
          <Field label="متن معرفی برند"><textarea className="admin-textarea" defaultValue={brandingMock.footerBlurb} rows={4} /></Field>
          <Field label="متن کپی‌رایت"><input className="admin-input" defaultValue={brandingMock.copyrightText} /></Field>
          <Field label="نشانی گزارش خطا"><input className="admin-input" dir="ltr" defaultValue={brandingMock.errorReportUrl} /></Field>
        </Card>
      )}

      {tab === "contact" && (
        <Card title="اطلاعات تماس پایه">
          <Field label="نشانی پستی"><textarea className="admin-textarea" defaultValue={brandingMock.postalAddress} rows={2} /></Field>
          <Field label="کد پستی"><input className="admin-input" dir="ltr" defaultValue={brandingMock.postalCode} /></Field>
        </Card>
      )}
    </>
  );
}
