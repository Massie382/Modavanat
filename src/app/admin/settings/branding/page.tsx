"use client";

import { useState } from "react";
import { PageHead, Card, Field, Tabs, Notice } from "@/components/admin/primitives";
import { useToast } from "@/hooks/use-toast";
import { useAdminSettings } from "@/hooks/use-admin-settings";

// Phase 7 — wired to /api/admin/settings?key=branding. Settings
// are deep-merged on top of these defaults so old DB rows pick up
// newly added fields automatically.
interface BrandingSettings {
  siteName: string;
  tagline: string;
  description: string;
  logos: {
    light: string;
    dark: string;
    account: string;
    favicon: string;
    ogImage: string;
    appleTouchIcon: string;
  };
  logoDimensions: { width: number; height: number };
  headerHeightDesktop: number;
  headerHeightMobile: number;
  containerMaxWidth: number;
  footerBlurb: string;
  copyrightText: string;
  version: string;
  lastUpdated: string;
  errorReportUrl: string;
  postalAddress: string;
  postalCode: string;
}

const defaults: BrandingSettings = {
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
  postalAddress:
    "تهران، خیابان ولیعصر، بالاتر از میدان ونک، پلاک ۱۵۳۴، طبقه ۴",
  postalCode: "۱۹۶۱۹۵۴۳۲۱",
};

export default function BrandingSettingsPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState("identity");
  const { data, setData, loading, error, saving, save } =
    useAdminSettings<BrandingSettings>("branding", defaults);

  const onSave = async () => {
    const ok = await save();
    toast({
      title: ok ? "ذخیره شد" : "خطا در ذخیره",
      description: ok
        ? "تنظیمات برندینگ با موفقیت ذخیره شد."
        : error ?? "ذخیره با خطا مواجه شد.",
    });
  };

  return (
    <>
      <PageHead
        title="نام و نشان"
        subtitle="هویت بصری برند، لوگوها و اطلاعات پایه"
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
      {loading && <Notice variant="info">در حال بارگذاری تنظیمات…</Notice>}
      {error && <Notice variant="danger">خطا: {error}</Notice>}
      <Tabs
        tabs={[
          { id: "identity", label: "هویت" },
          { id: "logos", label: "لوگوها" },
          { id: "header", label: "سرصفحه" },
          { id: "footer", label: "پاصفحه" },
          { id: "contact", label: "اطلاعات تماس" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "identity" && (
        <div className="admin-grid-2">
          <Card title="نام و توضیحات">
            <Field label="نام سایت">
              <input
                className="admin-input"
                value={data.siteName}
                onChange={(e) => setData({ ...data, siteName: e.target.value })}
              />
            </Field>
            <Field label="شعار (Tagline)">
              <input
                className="admin-input"
                value={data.tagline}
                onChange={(e) => setData({ ...data, tagline: e.target.value })}
              />
            </Field>
            <Field label="توضیحات کوتاه">
              <textarea
                className="admin-textarea"
                rows={3}
                value={data.description}
                onChange={(e) => setData({ ...data, description: e.target.value })}
              />
            </Field>
            <div className="admin-grid-2">
              <Field label="نسخه">
                <input
                  className="admin-input"
                  value={data.version}
                  onChange={(e) => setData({ ...data, version: e.target.value })}
                />
              </Field>
              <Field label="آخرین به‌روزرسانی">
                <input
                  className="admin-input"
                  dir="ltr"
                  value={data.lastUpdated}
                  onChange={(e) => setData({ ...data, lastUpdated: e.target.value })}
                />
              </Field>
            </div>
          </Card>
        </div>
      )}

      {tab === "logos" && (
        <div className="admin-stack">
          <Card title="لوگوها" desc="تصاویر برند در حالت‌های مختلف">
            <div className="admin-grid-3">
              {([
                { key: "light", label: "لوگوی روشن (سرصفحه)" },
                { key: "dark", label: "لوگوی تیره (پاصفحه)" },
                { key: "account", label: "لوگوی پنل کاربری" },
                { key: "favicon", label: "Favicon" },
                { key: "ogImage", label: "تصویر OpenGraph" },
                { key: "appleTouchIcon", label: "Apple Touch Icon" },
              ] as const).map((l) => {
                const val = data.logos[l.key as keyof BrandingSettings["logos"]] || "";
                return (
                  <div
                    key={l.key}
                    style={{
                      border: "1px solid var(--admin-border)",
                      borderRadius: 4,
                      padding: "0.75rem",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        height: 80,
                        display: "grid",
                        placeItems: "center",
                        backgroundColor: "var(--admin-surface-sunken)",
                        borderRadius: 4,
                        marginBottom: "0.5rem",
                      }}
                    >
                      {val ? (
                        <span className="admin-muted">تصویر</span>
                      ) : (
                        <span className="admin-muted">آپلود نشده</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 500, marginBottom: "0.25rem" }}>
                      {l.label}
                    </div>
                    <input
                      className="admin-input admin-input-sm admin-mono"
                      dir="ltr"
                      value={val}
                      placeholder="مسیر فایل"
                      onChange={(e) =>
                        setData({
                          ...data,
                          logos: { ...data.logos, [l.key]: e.target.value },
                        })
                      }
                    />
                  </div>
                );
              })}
            </div>
          </Card>
          <Card title="ابعاد لوگو">
            <div className="admin-grid-2">
              <Field label="عرض (px)">
                <input
                  className="admin-input"
                  type="number"
                  dir="ltr"
                  value={data.logoDimensions.width}
                  onChange={(e) =>
                    setData({
                      ...data,
                      logoDimensions: {
                        ...data.logoDimensions,
                        width: Number(e.target.value) || 0,
                      },
                    })
                  }
                />
              </Field>
              <Field label="ارتفاع (px)">
                <input
                  className="admin-input"
                  type="number"
                  dir="ltr"
                  value={data.logoDimensions.height}
                  onChange={(e) =>
                    setData({
                      ...data,
                      logoDimensions: {
                        ...data.logoDimensions,
                        height: Number(e.target.value) || 0,
                      },
                    })
                  }
                />
              </Field>
            </div>
          </Card>
        </div>
      )}

      {tab === "header" && (
        <Card title="تنظیمات سرصفحه">
          <div className="admin-grid-2">
            <Field label="ارتفاع سرصفحه - دسکتاپ (px)">
              <input
                className="admin-input"
                type="number"
                dir="ltr"
                value={data.headerHeightDesktop}
                onChange={(e) =>
                  setData({ ...data, headerHeightDesktop: Number(e.target.value) || 0 })
                }
              />
            </Field>
            <Field label="ارتفاع سرصفحه - موبایل (px)">
              <input
                className="admin-input"
                type="number"
                dir="ltr"
                value={data.headerHeightMobile}
                onChange={(e) =>
                  setData({ ...data, headerHeightMobile: Number(e.target.value) || 0 })
                }
              />
            </Field>
          </div>
          <Field label="حداکثر عرض محتوا (px)">
            <input
              className="admin-input"
              type="number"
              dir="ltr"
              value={data.containerMaxWidth}
              onChange={(e) =>
                setData({ ...data, containerMaxWidth: Number(e.target.value) || 0 })
              }
            />
          </Field>
        </Card>
      )}

      {tab === "footer" && (
        <Card title="تنظیمات پاصفحه">
          <Field label="متن معرفی برند">
            <textarea
              className="admin-textarea"
              rows={4}
              value={data.footerBlurb}
              onChange={(e) => setData({ ...data, footerBlurb: e.target.value })}
            />
          </Field>
          <Field label="متن کپی‌رایت">
            <input
              className="admin-input"
              value={data.copyrightText}
              onChange={(e) => setData({ ...data, copyrightText: e.target.value })}
            />
          </Field>
          <Field label="نشانی گزارش خطا">
            <input
              className="admin-input"
              dir="ltr"
              value={data.errorReportUrl}
              onChange={(e) => setData({ ...data, errorReportUrl: e.target.value })}
            />
          </Field>
        </Card>
      )}

      {tab === "contact" && (
        <Card title="اطلاعات تماس پایه">
          <Field label="نشانی پستی">
            <textarea
              className="admin-textarea"
              rows={2}
              value={data.postalAddress}
              onChange={(e) => setData({ ...data, postalAddress: e.target.value })}
            />
          </Field>
          <Field label="کد پستی">
            <input
              className="admin-input"
              dir="ltr"
              value={data.postalCode}
              onChange={(e) => setData({ ...data, postalCode: e.target.value })}
            />
          </Field>
        </Card>
      )}
    </>
  );
}
