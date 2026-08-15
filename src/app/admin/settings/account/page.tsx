"use client";

import { useState } from "react";
import { PageHead, Card, Field, Switch, Tabs } from "@/components/admin/primitives";
import { useToast } from "@/hooks/use-toast";
import { defaultAccountSettings } from "@/lib/admin-data";

export default function AccountSettingsPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState("general");
  return (
    <>
      <PageHead title="تنظیمات پنل کاربری" subtitle="تب‌ها، دسته‌بندی تیکت‌ها، روش‌های پرداخت و ترجیحات" actions={<button className="admin-btn admin-btn-primary" onClick={() => toast({ title: "ذخیره شد", description: "تنظیمات با موفقیت ثبت شد." })}>ذخیره</button>} />
      <Tabs tabs={[{ id: "general", label: "عمومی" }, { id: "tickets", label: "تیکت‌ها" }, { id: "purchases", label: "خریدها" }, { id: "preferences", label: "ترجیحات" }]} active={tab} onChange={setTab} />

      {tab === "general" && (
        <Card title="تب‌های پنل کاربری">
          <div className="admin-stack-sm">
            {defaultAccountSettings.visibleTabs.map((t) => (
              <div key={t.id} className="admin-row-between">
                <div><div style={{ fontSize: 13 }}>{t.label}</div><code className="admin-mono admin-muted">{t.id}</code></div>
                <Switch on={t.visible} onChange={() => {}} />
              </div>
            ))}
          </div>
          <Field label="لوگوی پنل کاربری"><input className="admin-input admin-mono" dir="ltr" defaultValue={defaultAccountSettings.accountLogo} /></Field>
        </Card>
      )}

      {tab === "tickets" && (
        <div className="admin-stack">
          <Card title="دسته‌بندی‌های تیکت">
            <table className="admin-table">
              <thead><tr><th>شناسه</th><th>برچسب</th><th className="col-narrow">فعال</th></tr></thead>
              <tbody>
                {defaultAccountSettings.ticketCategories.map((c) => (
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
                {defaultAccountSettings.ticketStatuses.map((s) => (
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
                {defaultAccountSettings.purchaseStatuses.map((s) => (
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
                {defaultAccountSettings.paymentMethods.map((m) => (
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
              {defaultAccountSettings.preferences.map((p) => (
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
