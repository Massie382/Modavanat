"use client";

import { useState } from "react";
import { PageHead, Card, Field, Switch, Tabs, Notice } from "@/components/admin/primitives";
import { useToast } from "@/hooks/use-toast";
import { useAdminSettings } from "@/hooks/use-admin-settings";

// Phase 7 — wired to /api/admin/settings?key=seo.
interface SeoSettings {
  siteTitle: string;
  siteDescription: string;
  keywords: string[];
  author: string;
  metadataBase: string;
  defaultOgImage: string;
  twitterCard: "summary" | "summary_large_image" | "app";
  robotsIndex: boolean;
  robotsFollow: boolean;
  canonicalUrl: string;
  lang: string;
  dir: "rtl" | "ltr";
  robotsTxt: string;
  sitemapEnabled: boolean;
  sitemapUrl: string;
}

const defaults: SeoSettings = {
  siteTitle: "مدونات | مرجع جامع قوانین جمهوری اسلامی ایران",
  siteDescription:
    "جستجو، مرور و مطالعه قوانین و مقررات جمهوری اسلامی ایران به‌همراه خط زمانی اصلاحات و ارجاعات متقابل قانون‌ها.",
  keywords: [
    "قانون",
    "مدونات",
    "قوانین ایران",
    "قانون مدنی",
    "قانون مجازات اسلامی",
    "قانون تجارت",
    "قانون کار",
    "قانون اساسی",
  ],
  author: "modavanat.ir",
  metadataBase: "https://modavanat.ir",
  defaultOgImage: "",
  twitterCard: "summary_large_image",
  robotsIndex: true,
  robotsFollow: true,
  canonicalUrl: "https://modavanat.ir",
  lang: "fa",
  dir: "rtl",
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
  const { data, setData, loading, error, saving, save } =
    useAdminSettings<SeoSettings>("seo", defaults);

  const onSave = async () => {
    const ok = await save();
    toast({
      title: ok ? "ذخیره شد" : "خطا",
      description: ok ? "تنظیمات سئو ذخیره شد." : error ?? "خطا در ذخیره",
    });
  };

  return (
    <>
      <PageHead
        title="سئو و متا"
        subtitle="تنظیمات فراداده، robots.txt و sitemap"
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
      <Tabs
        tabs={[
          { id: "general", label: "عمومی" },
          { id: "social", label: "شبکه‌های اجتماعی" },
          { id: "robots", label: "Robots.txt" },
          { id: "sitemap", label: "Sitemap" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "general" && (
        <div className="admin-stack">
          <Card title="فراداده پیش‌فرض">
            <Field label="عنوان سایت (Title)">
              <input
                className="admin-input"
                value={data.siteTitle}
                onChange={(e) => setData({ ...data, siteTitle: e.target.value })}
              />
            </Field>
            <Field label="توضیحات (Description)">
              <textarea
                className="admin-textarea"
                rows={3}
                value={data.siteDescription}
                onChange={(e) => setData({ ...data, siteDescription: e.target.value })}
              />
            </Field>
            <Field label="نویسنده">
              <input
                className="admin-input"
                dir="ltr"
                value={data.author}
                onChange={(e) => setData({ ...data, author: e.target.value })}
              />
            </Field>
            <Field label="آدرس پایه (metadataBase)">
              <input
                className="admin-input admin-mono"
                dir="ltr"
                value={data.metadataBase}
                onChange={(e) => setData({ ...data, metadataBase: e.target.value })}
              />
            </Field>
            <Field label="URL کانونیکال">
              <input
                className="admin-input admin-mono"
                dir="ltr"
                value={data.canonicalUrl}
                onChange={(e) => setData({ ...data, canonicalUrl: e.target.value })}
              />
            </Field>
            <div className="admin-grid-2">
              <Field label="زبان">
                <input
                  className="admin-input admin-mono"
                  dir="ltr"
                  value={data.lang}
                  onChange={(e) => setData({ ...data, lang: e.target.value })}
                />
              </Field>
              <Field label="جهت">
                <select
                  className="admin-select"
                  value={data.dir}
                  onChange={(e) =>
                    setData({ ...data, dir: e.target.value as "rtl" | "ltr" })
                  }
                >
                  <option value="rtl">rtl</option>
                  <option value="ltr">ltr</option>
                </select>
              </Field>
            </div>
          </Card>
          <Card title="کلمات کلیدی">
            <Field label="کلمات کلیدی (با کاما جدا کنید)">
              <textarea
                className="admin-textarea"
                rows={2}
                value={data.keywords.join("، ")}
                onChange={(e) =>
                  setData({
                    ...data,
                    keywords: e.target.value
                      .split(/[،,]/)
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
              />
            </Field>
          </Card>
          <Card title="ایندکس‌گذاری">
            <div className="admin-row-between">
              <span style={{ fontSize: 13 }}>اجازه ایندکس‌گذاری توسط موتورهای جستجو</span>
              <Switch
                on={data.robotsIndex}
                onChange={(v) => setData({ ...data, robotsIndex: v })}
              />
            </div>
            <div className="admin-row-between">
              <span style={{ fontSize: 13 }}>اجازه دنبال کردن پیوندها</span>
              <Switch
                on={data.robotsFollow}
                onChange={(v) => setData({ ...data, robotsFollow: v })}
              />
            </div>
          </Card>
        </div>
      )}

      {tab === "social" && (
        <Card title="OpenGraph و Twitter Card">
          <Field label="تصویر پیش‌فرض OpenGraph">
            <input
              className="admin-input admin-mono"
              dir="ltr"
              value={data.defaultOgImage}
              placeholder="/og-image.png"
              onChange={(e) => setData({ ...data, defaultOgImage: e.target.value })}
            />
          </Field>
          <Field label="نوع Twitter Card">
            <select
              className="admin-select"
              value={data.twitterCard}
              onChange={(e) =>
                setData({
                  ...data,
                  twitterCard: e.target.value as SeoSettings["twitterCard"],
                })
              }
            >
              <option value="summary">summary</option>
              <option value="summary_large_image">summary_large_image</option>
              <option value="app">app</option>
            </select>
          </Field>
        </Card>
      )}

      {tab === "robots" && (
        <Card title="Robots.txt" desc="محتوای فایل robots.txt در ریشه دامنه">
          <textarea
            className="admin-textarea admin-mono"
            rows={12}
            dir="ltr"
            style={{ fontFamily: "ui-monospace, monospace", fontSize: 12 }}
            value={data.robotsTxt}
            onChange={(e) => setData({ ...data, robotsTxt: e.target.value })}
          />
        </Card>
      )}

      {tab === "sitemap" && (
        <Card title="Sitemap">
          <div className="admin-row-between" style={{ marginBottom: "1rem" }}>
            <span style={{ fontSize: 13 }}>فعال‌سازی sitemap</span>
            <Switch
              on={data.sitemapEnabled}
              onChange={(v) => setData({ ...data, sitemapEnabled: v })}
            />
          </div>
          <Field label="آدرس sitemap">
            <input
              className="admin-input admin-mono"
              dir="ltr"
              value={data.sitemapUrl}
              onChange={(e) => setData({ ...data, sitemapUrl: e.target.value })}
            />
          </Field>
        </Card>
      )}
    </>
  );
}
