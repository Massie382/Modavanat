"use client";

import { useState } from "react";
import { PageHead, Card, Field, Switch, Tabs, Notice } from "@/components/admin/primitives";
import { useToast } from "@/hooks/use-toast";

// Phase 7 — frontend only. Browse + search settings will be persisted
// via /api/admin/settings?key=browse-search (scaffolded) but the form
// below is not yet wired to read/write that endpoint.
const browseMock = {
  pageTitle: "مرور قوانین",
  pageDescription:
    "فهرست کامل قوانین و مقررات جمهوری اسلامی ایران به‌ترتیب سال تصویب. برای فیلتر کردن از منوهای بالا استفاده کنید.",
  footerNote:
    "قوانین منسوخ با رنگ خاکستری نمایش داده می‌شوند. شماره ثبت مجلس برای قوانین مصوب پس از ۱۳۵۷ نمایش داده می‌شود.",
  defaultSortBy: "year" as const,
  defaultSortDir: "desc" as const,
  columns: [
    { id: "title", label: "عنوان قانون", visible: true, width: "44%" },
    { id: "year-number", label: "سال و شماره", visible: true, width: "16%" },
    { id: "type", label: "نوع", visible: true, width: "16%" },
    { id: "status", label: "وضعیت", visible: true, width: "12%" },
    { id: "subject", label: "موضوع", visible: true, width: "12%" },
  ],
  pageSize: null as number | null,
  enablePagination: false,
};

const searchMock = {
  pageTitle: "جستجوی پیشرفته",
  pageSubtitle: "جستجو در متن کامل قوانین، مواد و ارجاعات با فیلترهای پیشرفته",
  searchPlaceholder: "عبارت مورد نظر را وارد کنید…",
  resultsPageSize: 10,
  facets: [
    { id: "year", label: "سال تصویب", visible: true },
    { id: "subject", label: "موضوع", visible: true },
    { id: "type", label: "نوع قانون", visible: false },
    { id: "status", label: "وضعیت", visible: false },
    { id: "authority", label: "مرجع تصویب", visible: false },
  ],
  showMatchCounts: true,
  emptyStateTitle: "نتیجه‌ای یافت نشد",
  emptyStateDesc: "عبارت را اصلاح کنید یا فیلترها را تغییر دهید.",
  searchScope: {
    title: true, description: true, subject: true, year: true,
    number: true, articleText: true, articleNumber: true,
  },
  suggestionMax: 6,
  suggestionEnabled: true,
};

export default function BrowseSearchSettingsPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState("browse");
  return (
    <>
      <PageHead title="مرور و جستجو" subtitle="تنظیمات صفحات مرور قوانین و جستجوی پیشرفته" actions={<button className="admin-btn admin-btn-primary" onClick={() => toast({ title: "اطلاع", description: "ذخیره در فاز ۷." })}>ذخیره</button>} />
      <Notice variant="warning">Phase 7 — frontend only.</Notice>
      <Tabs tabs={[{ id: "browse", label: "مرور قوانین" }, { id: "search", label: "جستجوی پیشرفته" }, { id: "suggestions", label: "پیشنهادات" }]} active={tab} onChange={setTab} />

      {tab === "browse" && (
        <div className="admin-stack">
          <Card title="مشخصات صفحه">
            <Field label="عنوان صفحه"><input className="admin-input" defaultValue={browseMock.pageTitle} /></Field>
            <Field label="توضیحات"><textarea className="admin-textarea" defaultValue={browseMock.pageDescription} rows={2} /></Field>
            <Field label="یادداشت پایین صفحه"><textarea className="admin-textarea" defaultValue={browseMock.footerNote} rows={2} /></Field>
          </Card>
          <Card title="چیدمان جدول">
            <div className="admin-grid-2">
              <Field label="مرتب‌سازی پیش‌فرض">
                <select className="admin-select" defaultValue={browseMock.defaultSortBy}>
                  <option value="year">سال</option><option value="title">عنوان</option><option value="status">وضعیت</option>
                </select>
              </Field>
              <Field label="جهت مرتب‌سازی">
                <select className="admin-select" defaultValue={browseMock.defaultSortDir}>
                  <option value="asc">صعودی</option><option value="desc">نزولی</option>
                </select>
              </Field>
            </div>
            <table className="admin-table" style={{ marginTop: "1rem" }}>
              <thead><tr><th>ستون</th><th>برچسب</th><th>عرض</th><th className="col-narrow">نمایش</th></tr></thead>
              <tbody>
                {browseMock.columns.map((c) => (
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
              <Switch on={browseMock.enablePagination} onChange={() => {}} />
            </div>
            <Field label="تعداد در هر صفحه"><input className="admin-input" type="number" defaultValue={browseMock.pageSize || 20} dir="ltr" /></Field>
          </Card>
        </div>
      )}

      {tab === "search" && (
        <div className="admin-stack">
          <Card title="مشخصات صفحه">
            <Field label="عنوان"><input className="admin-input" defaultValue={searchMock.pageTitle} /></Field>
            <Field label="زیرعنوان"><input className="admin-input" defaultValue={searchMock.pageSubtitle} /></Field>
            <Field label="متن راهنمای جستجو"><input className="admin-input" defaultValue={searchMock.searchPlaceholder} /></Field>
            <div className="admin-grid-2">
              <Field label="تعداد نتایج در هر صفحه"><input className="admin-input" type="number" defaultValue={searchMock.resultsPageSize} dir="ltr" /></Field>
              <Field label="حداکثر پیشنهادها"><input className="admin-input" type="number" defaultValue={searchMock.suggestionMax} dir="ltr" /></Field>
            </div>
            <Field label="عنوان حالت خالی"><input className="admin-input" defaultValue={searchMock.emptyStateTitle} /></Field>
            <Field label="توضیح حالت خالی"><input className="admin-input" defaultValue={searchMock.emptyStateDesc} /></Field>
          </Card>

          <Card title="دامنه جستجو" desc="کدام فیلدها در جستجو لحاظ شوند">
            <div className="admin-grid-2">
              {Object.entries(searchMock.searchScope).map(([k, v]) => (
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
                {searchMock.facets.map((f) => (
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
            <Switch on={searchMock.suggestionEnabled} onChange={() => {}} />
          </div>
          <Field label="حداکثر تعداد پیشنهادها"><input className="admin-input" type="number" defaultValue={searchMock.suggestionMax} dir="ltr" /></Field>
          <Field label="نمایش تعداد تطبیق‌ها"><Switch on={searchMock.showMatchCounts} onChange={() => {}} /></Field>
        </Card>
      )}
    </>
  );
}
