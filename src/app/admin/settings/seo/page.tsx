"use client";

import { useState } from "react";
import { PageHead, Card, Field, Switch, Tabs } from "@/components/admin/primitives";
import { defaultSeo } from "@/lib/admin-data";

export default function SeoSettingsPage() {
  const [tab, setTab] = useState("general");
  return (
    <>
      <PageHead title="سئو و متا" subtitle="تنظیمات فراداده، robots.txt و sitemap" actions={<button className="admin-btn admin-btn-primary">ذخیره</button>} />
      <Tabs tabs={[{ id: "general", label: "عمومی" }, { id: "social", label: "شبکه‌های اجتماعی" }, { id: "robots", label: "Robots.txt" }, { id: "sitemap", label: "Sitemap" }]} active={tab} onChange={setTab} />

      {tab === "general" && (
        <div className="admin-stack">
          <Card title="فراداده پیش‌فرض">
            <Field label="عنوان سایت (Title)"><input className="admin-input" defaultValue={defaultSeo.siteTitle} /></Field>
            <Field label="توضیحات (Description)"><textarea className="admin-textarea" defaultValue={defaultSeo.siteDescription} rows={3} /></Field>
            <Field label="نویسنده"><input className="admin-input" dir="ltr" defaultValue={defaultSeo.author} /></Field>
            <Field label="آدرس پایه (metadataBase)"><input className="admin-input admin-mono" dir="ltr" defaultValue={defaultSeo.metadataBase} /></Field>
            <Field label="URL کانونیکال"><input className="admin-input admin-mono" dir="ltr" defaultValue={defaultSeo.canonicalUrl} /></Field>
            <div className="admin-grid-2">
              <Field label="زبان"><input className="admin-input admin-mono" dir="ltr" defaultValue={defaultSeo.lang} /></Field>
              <Field label="جهت"><select className="admin-select" defaultValue={defaultSeo.dir}><option value="rtl">rtl</option><option value="ltr">ltr</option></select></Field>
            </div>
          </Card>
          <Card title="کلمات کلیدی">
            <Field label="کلمات کلیدی (با کاما جدا کنید)">
              <textarea className="admin-textarea" defaultValue={defaultSeo.keywords.join("، ")} rows={2} />
            </Field>
          </Card>
          <Card title="ایندکس‌گذاری">
            <div className="admin-row-between">
              <span style={{ fontSize: 13 }}>اجازه ایندکس‌گذاری توسط موتورهای جستجو</span>
              <Switch on={defaultSeo.robotsIndex} onChange={() => {}} />
            </div>
            <div className="admin-row-between">
              <span style={{ fontSize: 13 }}>اجازه دنبال کردن پیوندها</span>
              <Switch on={defaultSeo.robotsFollow} onChange={() => {}} />
            </div>
          </Card>
        </div>
      )}

      {tab === "social" && (
        <Card title="OpenGraph و Twitter Card">
          <Field label="تصویر پیش‌فرض OpenGraph"><input className="admin-input admin-mono" dir="ltr" defaultValue={defaultSeo.defaultOgImage} placeholder="/og-image.png" /></Field>
          <Field label="نوع Twitter Card">
            <select className="admin-select" defaultValue={defaultSeo.twitterCard}>
              <option value="summary">summary</option>
              <option value="summary_large_image">summary_large_image</option>
              <option value="app">app</option>
            </select>
          </Field>
        </Card>
      )}

      {tab === "robots" && (
        <Card title="Robots.txt" desc="محتوای فایل robots.txt در ریشه دامنه">
          <textarea className="admin-textarea admin-mono" defaultValue={defaultSeo.robotsTxt} rows={12} dir="ltr" style={{ fontFamily: "ui-monospace, monospace", fontSize: 12 }} />
        </Card>
      )}

      {tab === "sitemap" && (
        <Card title="Sitemap">
          <div className="admin-row-between" style={{ marginBottom: "1rem" }}>
            <span style={{ fontSize: 13 }}>فعال‌سازی sitemap</span>
            <Switch on={defaultSeo.sitemapEnabled} onChange={() => {}} />
          </div>
          <Field label="آدرس sitemap"><input className="admin-input admin-mono" dir="ltr" defaultValue={defaultSeo.sitemapUrl} /></Field>
        </Card>
      )}
    </>
  );
}
