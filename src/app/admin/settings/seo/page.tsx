"use client";

import { useState } from "react";
import { PageHead, Card, Field, Switch, Tabs, Notice } from "@/components/admin/primitives";
import { useToast } from "@/hooks/use-toast";

// Phase 7 — frontend only. SEO settings will be persisted via
// /api/admin/settings?key=seo (scaffolded) but the form below is not
// yet wired to read/write that endpoint.
const seoMock = {
  siteTitle: "مدونات | مرجع جامع قوانین جمهوری اسلامی ایران",
  siteDescription:
    "جستجو، مرور و مطالعه قوانین و مقررات جمهوری اسلامی ایران به‌همراه خط زمانی اصلاحات و ارجاعات متقابل قانون‌ها.",
  keywords: [
    "قانون", "مدونات", "قوانین ایران", "قانون مدنی",
    "قانون مجازات اسلامی", "قانون تجارت", "قانون کار", "قانون اساسی",
  ],
  author: "modavanat.ir",
  metadataBase: "https://modavanat.ir",
  defaultOgImage: "",
  twitterCard: "summary_large_image" as const,
  robotsIndex: true,
  robotsFollow: true,
  canonicalUrl: "https://modavanat.ir",
  lang: "fa",
  dir: "rtl" as const,
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

export default function SeoSettingsPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState("general");
  return (
    <>
      <PageHead title="سئو و متا" subtitle="تنظیمات فراداده، robots.txt و sitemap" actions={<button className="admin-btn admin-btn-primary" onClick={() => toast({ title: "اطلاع", description: "ذخیره در فاز ۷." })}>ذخیره</button>} />
      <Notice variant="warning">Phase 7 — frontend only.</Notice>
      <Tabs tabs={[{ id: "general", label: "عمومی" }, { id: "social", label: "شبکه‌های اجتماعی" }, { id: "robots", label: "Robots.txt" }, { id: "sitemap", label: "Sitemap" }]} active={tab} onChange={setTab} />

      {tab === "general" && (
        <div className="admin-stack">
          <Card title="فراداده پیش‌فرض">
            <Field label="عنوان سایت (Title)"><input className="admin-input" defaultValue={seoMock.siteTitle} /></Field>
            <Field label="توضیحات (Description)"><textarea className="admin-textarea" defaultValue={seoMock.siteDescription} rows={3} /></Field>
            <Field label="نویسنده"><input className="admin-input" dir="ltr" defaultValue={seoMock.author} /></Field>
            <Field label="آدرس پایه (metadataBase)"><input className="admin-input admin-mono" dir="ltr" defaultValue={seoMock.metadataBase} /></Field>
            <Field label="URL کانونیکال"><input className="admin-input admin-mono" dir="ltr" defaultValue={seoMock.canonicalUrl} /></Field>
            <div className="admin-grid-2">
              <Field label="زبان"><input className="admin-input admin-mono" dir="ltr" defaultValue={seoMock.lang} /></Field>
              <Field label="جهت"><select className="admin-select" defaultValue={seoMock.dir}><option value="rtl">rtl</option><option value="ltr">ltr</option></select></Field>
            </div>
          </Card>
          <Card title="کلمات کلیدی">
            <Field label="کلمات کلیدی (با کاما جدا کنید)">
              <textarea className="admin-textarea" defaultValue={seoMock.keywords.join("، ")} rows={2} />
            </Field>
          </Card>
          <Card title="ایندکس‌گذاری">
            <div className="admin-row-between">
              <span style={{ fontSize: 13 }}>اجازه ایندکس‌گذاری توسط موتورهای جستجو</span>
              <Switch on={seoMock.robotsIndex} onChange={() => {}} />
            </div>
            <div className="admin-row-between">
              <span style={{ fontSize: 13 }}>اجازه دنبال کردن پیوندها</span>
              <Switch on={seoMock.robotsFollow} onChange={() => {}} />
            </div>
          </Card>
        </div>
      )}

      {tab === "social" && (
        <Card title="OpenGraph و Twitter Card">
          <Field label="تصویر پیش‌فرض OpenGraph"><input className="admin-input admin-mono" dir="ltr" defaultValue={seoMock.defaultOgImage} placeholder="/og-image.png" /></Field>
          <Field label="نوع Twitter Card">
            <select className="admin-select" defaultValue={seoMock.twitterCard}>
              <option value="summary">summary</option>
              <option value="summary_large_image">summary_large_image</option>
              <option value="app">app</option>
            </select>
          </Field>
        </Card>
      )}

      {tab === "robots" && (
        <Card title="Robots.txt" desc="محتوای فایل robots.txt در ریشه دامنه">
          <textarea className="admin-textarea admin-mono" defaultValue={seoMock.robotsTxt} rows={12} dir="ltr" style={{ fontFamily: "ui-monospace, monospace", fontSize: 12 }} />
        </Card>
      )}

      {tab === "sitemap" && (
        <Card title="Sitemap">
          <div className="admin-row-between" style={{ marginBottom: "1rem" }}>
            <span style={{ fontSize: 13 }}>فعال‌سازی sitemap</span>
            <Switch on={seoMock.sitemapEnabled} onChange={() => {}} />
          </div>
          <Field label="آدرس sitemap"><input className="admin-input admin-mono" dir="ltr" defaultValue={seoMock.sitemapUrl} /></Field>
        </Card>
      )}
    </>
  );
}
