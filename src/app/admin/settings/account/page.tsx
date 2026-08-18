"use client";

import { useState } from "react";
import { PageHead, Card, Field, Switch, Tabs, Notice } from "@/components/admin/primitives";
import { useToast } from "@/hooks/use-toast";

// Phase 7 — frontend only. Account-panel settings will be persisted
// via /api/admin/settings?key=account (scaffolded) but the form below
// is not yet wired to read/write that endpoint.
const accountSettingsMock = {
  visibleTabs: [
    { id: "bookmarks" as const, label: "نشانه‌گذاری‌ها", visible: true },
    { id: "settings" as const, label: "تنظیمات", visible: true },
    { id: "tickets" as const, label: "تیکت‌ها", visible: true },
    { id: "purchases" as const, label: "خریدها", visible: true },
  ],
  ticketCategories: [
    { id: "technical", label: "فنی", active: true },
    { id: "content", label: "محتوایی", active: true },
    { id: "add-law", label: "درخواست افزودن قانون", active: true },
    { id: "suggestion", label: "پیشنهاد", active: true },
    { id: "accessibility", label: "دسترسی‌پذیری", active: true },
    { id: "other", label: "سایر", active: true },
  ],
  ticketStatuses: [
    { id: "open", label: "باز", color: "#4a7c4a" },
    { id: "pending", label: "در حال بررسی", color: "#c08a3e" },
    { id: "closed", label: "بسته", color: "#6b7280" },
  ],
  purchaseStatuses: [
    { id: "paid", label: "پرداخت‌شده", color: "#4a7c4a" },
    { id: "pending", label: "در انتظار", color: "#c08a3e" },
    { id: "refunded", label: "بازگشت‌خورده", color: "#4a6c8a" },
    { id: "failed", label: "ناموفق", color: "#b85c5c" },
  ],
  paymentMethods: [
    { id: "zarinpal", label: "زرین‌پال", active: true },
    { id: "samankish", label: "سامان کیش", active: true },
    { id: "bank-transfer", label: "انتقال بانکی", active: true },
  ],
  preferences: [
    { id: "emailNotifications", label: "اطلاع‌رسانی ایمیلی", description: "دریافت اعلان‌ها از طریق ایمیل", defaultOn: true, visible: true },
    { id: "smsNotifications", label: "اطلاع‌رسانی پیامکی", description: "دریافت اعلان‌ها از طریق پیامک", defaultOn: false, visible: true },
    { id: "weeklyDigest", label: "گزارش هفتگی", description: "خلاصه هفتگی اصلاحات قوانین نشانه‌گذاری‌شده", defaultOn: true, visible: true },
    { id: "bookmarkAlerts", label: "هشدار نشانه‌گذاری‌ها", description: "اطلاع از اصلاحات قوانین نشانه‌گذاری‌شده", defaultOn: false, visible: true },
  ],
  bookmarksPageSize: 5,
  ticketsPageSize: 5,
  purchasesPageSize: 8,
  accountLogo: "/brand/logoaccount.webp",
};

export default function AccountSettingsPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState("general");
  return (
    <>
      <PageHead title="تنظیمات پنل کاربری" subtitle="تب‌ها، دسته‌بندی تیکت‌ها، روش‌های پرداخت و ترجیحات" actions={<button className="admin-btn admin-btn-primary" onClick={() => toast({ title: "اطلاع", description: "ذخیره در فاز ۷." })}>ذخیره</button>} />
      <Notice variant="warning">Phase 7 — frontend only.</Notice>
      <Tabs tabs={[{ id: "general", label: "عمومی" }, { id: "tickets", label: "تیکت‌ها" }, { id: "purchases", label: "خریدها" }, { id: "preferences", label: "ترجیحات" }]} active={tab} onChange={setTab} />

      {tab === "general" && (
        <Card title="تب‌های پنل کاربری">
          <div className="admin-stack-sm">
            {accountSettingsMock.visibleTabs.map((t) => (
              <div key={t.id} className="admin-row-between">
                <div><div style={{ fontSize: 13 }}>{t.label}</div><code className="admin-mono admin-muted">{t.id}</code></div>
                <Switch on={t.visible} onChange={() => {}} />
              </div>
            ))}
          </div>
          <Field label="لوگوی پنل کاربری"><input className="admin-input admin-mono" dir="ltr" defaultValue={accountSettingsMock.accountLogo} /></Field>
        </Card>
      )}

      {tab === "tickets" && (
        <div className="admin-stack">
          <Card title="دسته‌بندی‌های تیکت">
            <table className="admin-table">
              <thead><tr><th>شناسه</th><th>برچسب</th><th className="col-narrow">فعال</th></tr></thead>
              <tbody>
                {accountSettingsMock.ticketCategories.map((c) => (
                  <tr key={c.id}>
                    <td><code className="admin-mono admin-muted">{c.id}</code></td>
                    <td><input className="admin-input admin-input-sm" defaultValue={c.label} /></td>
                    <td className="col-narrow"><Switch on={c.active} onChange={() => {}} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Card title="وضعیت‌های تیکت">
            <table className="admin-table">
              <thead><tr><th>شناسه</th><th>برچسب</th><th>رنگ</th></tr></thead>
              <tbody>
                {accountSettingsMock.ticketStatuses.map((s) => (
                  <tr key={s.id}>
                    <td><code className="admin-mono admin-muted">{s.id}</code></td>
                    <td><input className="admin-input admin-input-sm" defaultValue={s.label} /></td>
                    <td><input type="color" defaultValue={s.color} style={{ width: 28, height: 24, border: "1px solid var(--admin-border)", borderRadius: 3, background: "transparent", cursor: "pointer" }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {tab === "purchases" && (
        <div className="admin-stack">
          <Card title="وضعیت‌های خرید">
            <table className="admin-table">
              <thead><tr><th>شناسه</th><th>برچسب</th><th>رنگ</th></tr></thead>
              <tbody>
                {accountSettingsMock.purchaseStatuses.map((s) => (
                  <tr key={s.id}>
                    <td><code className="admin-mono admin-muted">{s.id}</code></td>
                    <td><input className="admin-input admin-input-sm" defaultValue={s.label} /></td>
                    <td><input type="color" defaultValue={s.color} style={{ width: 28, height: 24, border: "1px solid var(--admin-border)", borderRadius: 3, background: "transparent", cursor: "pointer" }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Card title="روش‌های پرداخت">
            <table className="admin-table">
              <thead><tr><th>شناسه</th><th>برچسب</th><th className="col-narrow">فعال</th></tr></thead>
              <tbody>
                {accountSettingsMock.paymentMethods.map((m) => (
                  <tr key={m.id}>
                    <td><code className="admin-mono admin-muted">{m.id}</code></td>
                    <td><input className="admin-input admin-input-sm" defaultValue={m.label} /></td>
                    <td className="col-narrow"><Switch on={m.active} onChange={() => {}} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {tab === "preferences" && (
        <Card title="ترجیحات کاربر" desc="مدیریت گزینه‌های نمایش‌داده‌شده در تب تنظیمات کاربر">
          <table className="admin-table">
            <thead><tr><th>شناسه</th><th>برچسب</th><th>توضیحات</th><th className="col-narrow">پیش‌فرض</th><th className="col-narrow">نمایش</th></tr></thead>
            <tbody>
              {accountSettingsMock.preferences.map((p) => (
                <tr key={p.id}>
                  <td><code className="admin-mono admin-muted">{p.id}</code></td>
                  <td><input className="admin-input admin-input-sm" defaultValue={p.label} /></td>
                  <td><input className="admin-input admin-input-sm" defaultValue={p.description} /></td>
                  <td className="col-narrow"><Switch on={p.defaultOn} onChange={() => {}} /></td>
                  <td className="col-narrow"><Switch on={p.visible} onChange={() => {}} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
