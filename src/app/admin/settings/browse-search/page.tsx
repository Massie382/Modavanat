"use client";

import { useState } from "react";
import { PageHead, Card, Field, Switch, Tabs } from "@/components/admin/primitives";
import { defaultBrowseSettings, defaultSearchSettings } from "@/lib/admin-data";

export default function BrowseSearchSettingsPage() {
  const [tab, setTab] = useState("browse");
  return (
    <>
      <PageHead title="مرور و جستجو" subtitle="تنظیمات صفحات مرور قوانین و جستجوی پیشرفته" actions={<button className="admin-btn admin-btn-primary">ذخیره</button>} />
      <Tabs tabs={[{ id: "browse", label: "مرور قوانین" }, { id: "search", label: "جستجوی پیشرفته" }, { id: "suggestions", label: "پیشنهادات" }]} active={tab} onChange={setTab} />

      {tab === "browse" && (
        <div className="admin-stack">
          <Card title="مشخصات صفحه">
            <Field label="عنوان صفحه"><input className="admin-input" defaultValue={defaultBrowseSettings.pageTitle} /></Field>
            <Field label="توضیحات"><textarea className="admin-textarea" defaultValue={defaultBrowseSettings.pageDescription} rows={2} /></Field>
            <Field label="یادداشت پایین صفحه"><textarea className="admin-textarea" defaultValue={defaultBrowseSettings.footerNote} rows={2} /></Field>
          </Card>
          <Card title="چیدمان جدول">
            <div className="admin-grid-2">
              <Field label="مرتب‌سازی پیش‌فرض">
                <select className="admin-select" defaultValue={defaultBrowseSettings.defaultSortBy}>
                  <option value="year">سال</option><option value="title">عنوان</option><option value="status">وضعیت</option>
                </select>
              </Field>
              <Field label="جهت مرتب‌سازی">
                <select className="admin-select" defaultValue={defaultBrowseSettings.defaultSortDir}>
                  <option value="asc">صعودی</option><option value="desc">نزولی</option>
                </select>
              </Field>
            </div>
            <table className="admin-table" style={{ marginTop: "1rem" }}>
              <thead><tr><th>ستون</th><th>برچسب</th><th>عرض</th><th className="col-narrow">نمایش</th></tr></thead>
              <tbody>
                {defaultBrowseSettings.columns.map((c) => (
                  <tr key={c.id}>
                    <td><code className="admin-mono admin-muted">{c.id}</code></td>
                    <td><input className="admin-input admin-input-sm" defaultValue={c.label} /></td>
                    <td><input className="admin-input admin-input-sm admin-mono" dir="ltr" defaultValue={c.width} /></td>
                    <td className="col-narrow"><Switch on={c.visible} onChange={() => {}} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Card title="صفحه‌بندی">
            <div className="admin-row-between">
              <span style={{ fontSize: 13 }}>فعال‌سازی صفحه‌بندی</span>
              <Switch on={defaultBrowseSettings.enablePagination} onChange={() => {}} />
            </div>
            <Field label="تعداد در هر صفحه"><input className="admin-input" type="number" defaultValue={defaultBrowseSettings.pageSize || 20} dir="ltr" /></Field>
          </Card>
        </div>
      )}

      {tab === "search" && (
        <div className="admin-stack">
          <Card title="مشخصات صفحه">
            <Field label="عنوان"><input className="admin-input" defaultValue={defaultSearchSettings.pageTitle} /></Field>
            <Field label="زیرعنوان"><input className="admin-input" defaultValue={defaultSearchSettings.pageSubtitle} /></Field>
            <Field label="متن راهنمای جستجو"><input className="admin-input" defaultValue={defaultSearchSettings.searchPlaceholder} /></Field>
            <div className="admin-grid-2">
              <Field label="تعداد نتایج در هر صفحه"><input className="admin-input" type="number" defaultValue={defaultSearchSettings.resultsPageSize} dir="ltr" /></Field>
              <Field label="حداکثر پیشنهادها"><input className="admin-input" type="number" defaultValue={defaultSearchSettings.suggestionMax} dir="ltr" /></Field>
            </div>
            <Field label="عنوان حالت خالی"><input className="admin-input" defaultValue={defaultSearchSettings.emptyStateTitle} /></Field>
            <Field label="توضیح حالت خالی"><input className="admin-input" defaultValue={defaultSearchSettings.emptyStateDesc} /></Field>
          </Card>

          <Card title="دامنه جستجو" desc="کدام فیلدها در جستجو لحاظ شوند">
            <div className="admin-grid-2">
              {Object.entries(defaultSearchSettings.searchScope).map(([k, v]) => (
                <div key={k} className="admin-row-between" style={{ padding: "0.3rem 0" }}>
                  <span style={{ fontSize: 13 }}>{k === "title" ? "عنوان" : k === "description" ? "توضیحات" : k === "subject" ? "موضوع" : k === "year" ? "سال" : k === "number" ? "شماره" : k === "articleText" ? "متن مواد" : k === "articleNumber" ? "شماره مواد" : k}</span>
                  <Switch on={v as boolean} onChange={() => {}} />
                </div>
              ))}
            </div>
          </Card>

          <Card title="فیلترهای کناری (Facets)">
            <table className="admin-table">
              <thead><tr><th>فیلتر</th><th>برچسب</th><th className="col-narrow">نمایش</th></tr></thead>
              <tbody>
                {defaultSearchSettings.facets.map((f) => (
                  <tr key={f.id}>
                    <td><code className="admin-mono admin-muted">{f.id}</code></td>
                    <td><input className="admin-input admin-input-sm" defaultValue={f.label} /></td>
                    <td className="col-narrow"><Switch on={f.visible} onChange={() => {}} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {tab === "suggestions" && (
        <Card title="پیشنهادات جستجو" desc="Dropdown نمایش‌داده‌شده هنگام تایپ در فیلد جستجو">
          <div className="admin-row-between" style={{ marginBottom: "1rem" }}>
            <span style={{ fontSize: 13 }}>فعال‌سازی پیشنهادات</span>
            <Switch on={defaultSearchSettings.suggestionEnabled} onChange={() => {}} />
          </div>
          <Field label="حداکثر تعداد پیشنهادها"><input className="admin-input" type="number" defaultValue={defaultSearchSettings.suggestionMax} dir="ltr" /></Field>
          <Field label="نمایش تعداد تطبیق‌ها"><Switch on={defaultSearchSettings.showMatchCounts} onChange={() => {}} /></Field>
        </Card>
      )}
    </>
  );
}
