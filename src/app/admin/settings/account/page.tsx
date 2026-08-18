"use client";

import { useState } from "react";
import { PageHead, Card, Field, Switch, Tabs, Notice } from "@/components/admin/primitives";
import { useToast } from "@/hooks/use-toast";
import { useAdminSettings } from "@/hooks/use-admin-settings";

// Phase 7 — wired to /api/admin/settings?key=account.
interface AccountSettings {
  visibleTabs: { id: "bookmarks" | "settings" | "tickets" | "purchases"; label: string; visible: boolean }[];
  ticketCategories: { id: string; label: string; active: boolean }[];
  ticketStatuses: { id: string; label: string; color: string }[];
  purchaseStatuses: { id: string; label: string; color: string }[];
  paymentMethods: { id: string; label: string; active: boolean }[];
  preferences: { id: string; label: string; description: string; defaultOn: boolean; visible: boolean }[];
  bookmarksPageSize: number;
  ticketsPageSize: number;
  purchasesPageSize: number;
  accountLogo: string;
}

const defaults: AccountSettings = {
  visibleTabs: [
    { id: "bookmarks", label: "نشانه‌گذاری‌ها", visible: true },
    { id: "settings", label: "تنظیمات", visible: true },
    { id: "tickets", label: "تیکت‌ها", visible: true },
    { id: "purchases", label: "خریدها", visible: true },
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
  const { data, setData, loading, error, saving, save } =
    useAdminSettings<AccountSettings>("account", defaults);

  const onSave = async () => {
    const ok = await save();
    toast({
      title: ok ? "ذخیره شد" : "خطا",
      description: ok ? "تنظیمات پنل کاربری ذخیره شد." : error ?? "خطا در ذخیره",
    });
  };

  // Helpers for nested list updates.
  const updateList = <K extends keyof AccountSettings>(
    key: K,
    idx: number,
    patch: Partial<AccountSettings[K] extends Array<infer T> ? T : never>
  ) => {
    const list = [...(data[key] as unknown[])] as Record<string, unknown>[];
    list[idx] = { ...list[idx], ...patch };
    setData({ ...data, [key]: list } as unknown as AccountSettings);
  };

  return (
    <>
      <PageHead
        title="تنظیمات پنل کاربری"
        subtitle="تب‌ها، دسته‌بندی تیکت‌ها، روش‌های پرداخت و ترجیحات"
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
          { id: "tickets", label: "تیکت‌ها" },
          { id: "purchases", label: "خریدها" },
          { id: "preferences", label: "ترجیحات" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "general" && (
        <Card title="تب‌های پنل کاربری">
          <div className="admin-stack-sm">
            {data.visibleTabs.map((t, i) => (
              <div key={t.id} className="admin-row-between">
                <div>
                  <div style={{ fontSize: 13 }}>{t.label}</div>
                  <code className="admin-mono admin-muted">{t.id}</code>
                </div>
                <Switch
                  on={t.visible}
                  onChange={(v) => updateList("visibleTabs", i, { visible: v })}
                />
              </div>
            ))}
          </div>
          <Field label="لوگوی پنل کاربری">
            <input
              className="admin-input admin-mono"
              dir="ltr"
              value={data.accountLogo}
              onChange={(e) => setData({ ...data, accountLogo: e.target.value })}
            />
          </Field>
          <div className="admin-grid-3">
            <Field label="صفحه‌بندی نشانه‌ها">
              <input
                className="admin-input"
                type="number"
                dir="ltr"
                value={data.bookmarksPageSize}
                onChange={(e) =>
                  setData({ ...data, bookmarksPageSize: Number(e.target.value) || 0 })
                }
              />
            </Field>
            <Field label="صفحه‌بندی تیکت‌ها">
              <input
                className="admin-input"
                type="number"
                dir="ltr"
                value={data.ticketsPageSize}
                onChange={(e) =>
                  setData({ ...data, ticketsPageSize: Number(e.target.value) || 0 })
                }
              />
            </Field>
            <Field label="صفحه‌بندی خریدها">
              <input
                className="admin-input"
                type="number"
                dir="ltr"
                value={data.purchasesPageSize}
                onChange={(e) =>
                  setData({ ...data, purchasesPageSize: Number(e.target.value) || 0 })
                }
              />
            </Field>
          </div>
        </Card>
      )}

      {tab === "tickets" && (
        <div className="admin-stack">
          <Card title="دسته‌بندی‌های تیکت">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>شناسه</th>
                  <th>برچسب</th>
                  <th className="col-narrow">فعال</th>
                </tr>
              </thead>
              <tbody>
                {data.ticketCategories.map((c, i) => (
                  <tr key={c.id}>
                    <td>
                      <code className="admin-mono admin-muted">{c.id}</code>
                    </td>
                    <td>
                      <input
                        className="admin-input admin-input-sm"
                        value={c.label}
                        onChange={(e) => updateList("ticketCategories", i, { label: e.target.value })}
                      />
                    </td>
                    <td className="col-narrow">
                      <Switch
                        on={c.active}
                        onChange={(v) => updateList("ticketCategories", i, { active: v })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Card title="وضعیت‌های تیکت">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>شناسه</th>
                  <th>برچسب</th>
                  <th>رنگ</th>
                </tr>
              </thead>
              <tbody>
                {data.ticketStatuses.map((s, i) => (
                  <tr key={s.id}>
                    <td>
                      <code className="admin-mono admin-muted">{s.id}</code>
                    </td>
                    <td>
                      <input
                        className="admin-input admin-input-sm"
                        value={s.label}
                        onChange={(e) => updateList("ticketStatuses", i, { label: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        type="color"
                        value={s.color}
                        onChange={(e) => updateList("ticketStatuses", i, { color: e.target.value })}
                        style={{
                          width: 28,
                          height: 24,
                          border: "1px solid var(--admin-border)",
                          borderRadius: 3,
                          background: "transparent",
                          cursor: "pointer",
                        }}
                      />
                    </td>
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
              <thead>
                <tr>
                  <th>شناسه</th>
                  <th>برچسب</th>
                  <th>رنگ</th>
                </tr>
              </thead>
              <tbody>
                {data.purchaseStatuses.map((s, i) => (
                  <tr key={s.id}>
                    <td>
                      <code className="admin-mono admin-muted">{s.id}</code>
                    </td>
                    <td>
                      <input
                        className="admin-input admin-input-sm"
                        value={s.label}
                        onChange={(e) => updateList("purchaseStatuses", i, { label: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        type="color"
                        value={s.color}
                        onChange={(e) => updateList("purchaseStatuses", i, { color: e.target.value })}
                        style={{
                          width: 28,
                          height: 24,
                          border: "1px solid var(--admin-border)",
                          borderRadius: 3,
                          background: "transparent",
                          cursor: "pointer",
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Card title="روش‌های پرداخت">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>شناسه</th>
                  <th>برچسب</th>
                  <th className="col-narrow">فعال</th>
                </tr>
              </thead>
              <tbody>
                {data.paymentMethods.map((m, i) => (
                  <tr key={m.id}>
                    <td>
                      <code className="admin-mono admin-muted">{m.id}</code>
                    </td>
                    <td>
                      <input
                        className="admin-input admin-input-sm"
                        value={m.label}
                        onChange={(e) => updateList("paymentMethods", i, { label: e.target.value })}
                      />
                    </td>
                    <td className="col-narrow">
                      <Switch
                        on={m.active}
                        onChange={(v) => updateList("paymentMethods", i, { active: v })}
                      />
                    </td>
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
            <thead>
              <tr>
                <th>شناسه</th>
                <th>برچسب</th>
                <th>توضیحات</th>
                <th className="col-narrow">پیش‌فرض</th>
                <th className="col-narrow">نمایش</th>
              </tr>
            </thead>
            <tbody>
              {data.preferences.map((p, i) => (
                <tr key={p.id}>
                  <td>
                    <code className="admin-mono admin-muted">{p.id}</code>
                  </td>
                  <td>
                    <input
                      className="admin-input admin-input-sm"
                      value={p.label}
                      onChange={(e) => updateList("preferences", i, { label: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      className="admin-input admin-input-sm"
                      value={p.description}
                      onChange={(e) => updateList("preferences", i, { description: e.target.value })}
                    />
                  </td>
                  <td className="col-narrow">
                    <Switch
                      on={p.defaultOn}
                      onChange={(v) => updateList("preferences", i, { defaultOn: v })}
                    />
                  </td>
                  <td className="col-narrow">
                    <Switch
                      on={p.visible}
                      onChange={(v) => updateList("preferences", i, { visible: v })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
