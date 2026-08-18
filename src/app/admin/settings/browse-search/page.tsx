"use client";

import { useState } from "react";
import { PageHead, Card, Field, Switch, Tabs, Notice } from "@/components/admin/primitives";
import { useToast } from "@/hooks/use-toast";
import { useAdminSettings } from "@/hooks/use-admin-settings";

// Phase 7 — wired to /api/admin/settings?key=browse-search.
interface BrowseColumn {
  id: string;
  label: string;
  visible: boolean;
  width: string;
}
interface SearchFacet {
  id: string;
  label: string;
  visible: boolean;
}
interface SearchScope {
  title: boolean;
  description: boolean;
  subject: boolean;
  year: boolean;
  number: boolean;
  articleText: boolean;
  articleNumber: boolean;
}
interface BrowseSearchSettings {
  browse: {
    pageTitle: string;
    pageDescription: string;
    footerNote: string;
    defaultSortBy: "year" | "title" | "status";
    defaultSortDir: "asc" | "desc";
    columns: BrowseColumn[];
    pageSize: number | null;
    enablePagination: boolean;
  };
  search: {
    pageTitle: string;
    pageSubtitle: string;
    searchPlaceholder: string;
    resultsPageSize: number;
    facets: SearchFacet[];
    showMatchCounts: boolean;
    emptyStateTitle: string;
    emptyStateDesc: string;
    searchScope: SearchScope;
    suggestionMax: number;
    suggestionEnabled: boolean;
  };
}

const defaults: BrowseSearchSettings = {
  browse: {
    pageTitle: "مرور قوانین",
    pageDescription:
      "فهرست کامل قوانین و مقررات جمهوری اسلامی ایران به‌ترتیب سال تصویب. برای فیلتر کردن از منوهای بالا استفاده کنید.",
    footerNote:
      "قوانین منسوخ با رنگ خاکستری نمایش داده می‌شوند. شماره ثبت مجلس برای قوانین مصوب پس از ۱۳۵۷ نمایش داده می‌شود.",
    defaultSortBy: "year",
    defaultSortDir: "desc",
    columns: [
      { id: "title", label: "عنوان قانون", visible: true, width: "44%" },
      { id: "year-number", label: "سال و شماره", visible: true, width: "16%" },
      { id: "type", label: "نوع", visible: true, width: "16%" },
      { id: "status", label: "وضعیت", visible: true, width: "12%" },
      { id: "subject", label: "موضوع", visible: true, width: "12%" },
    ],
    pageSize: null,
    enablePagination: false,
  },
  search: {
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
      title: true,
      description: true,
      subject: true,
      year: true,
      number: true,
      articleText: true,
      articleNumber: true,
    },
    suggestionMax: 6,
    suggestionEnabled: true,
  },
};

const SCOPE_LABELS: Record<keyof SearchScope, string> = {
  title: "عنوان",
  description: "توضیحات",
  subject: "موضوع",
  year: "سال",
  number: "شماره",
  articleText: "متن مواد",
  articleNumber: "شماره مواد",
};

export default function BrowseSearchSettingsPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState("browse");
  const { data, setData, loading, error, saving, save } =
    useAdminSettings<BrowseSearchSettings>("browse-search", defaults);

  const onSave = async () => {
    const ok = await save();
    toast({
      title: ok ? "ذخیره شد" : "خطا",
      description: ok ? "تنظیمات مرور و جستجو ذخیره شد." : error ?? "خطا در ذخیره",
    });
  };

  const updateBrowse = (patch: Partial<BrowseSearchSettings["browse"]>) =>
    setData({ ...data, browse: { ...data.browse, ...patch } });
  const updateSearch = (patch: Partial<BrowseSearchSettings["search"]>) =>
    setData({ ...data, search: { ...data.search, ...patch } });
  const updateColumn = (i: number, patch: Partial<BrowseColumn>) => {
    const cols = [...data.browse.columns];
    cols[i] = { ...cols[i], ...patch };
    updateBrowse({ columns: cols });
  };
  const updateFacet = (i: number, patch: Partial<SearchFacet>) => {
    const facets = [...data.search.facets];
    facets[i] = { ...facets[i], ...patch };
    updateSearch({ facets });
  };
  const updateScope = (key: keyof SearchScope, value: boolean) =>
    updateSearch({ searchScope: { ...data.search.searchScope, [key]: value } });

  return (
    <>
      <PageHead
        title="مرور و جستجو"
        subtitle="تنظیمات صفحات مرور قوانین و جستجوی پیشرفته"
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
          { id: "browse", label: "مرور قوانین" },
          { id: "search", label: "جستجوی پیشرفته" },
          { id: "suggestions", label: "پیشنهادات" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "browse" && (
        <div className="admin-stack">
          <Card title="مشخصات صفحه">
            <Field label="عنوان صفحه">
              <input
                className="admin-input"
                value={data.browse.pageTitle}
                onChange={(e) => updateBrowse({ pageTitle: e.target.value })}
              />
            </Field>
            <Field label="توضیحات">
              <textarea
                className="admin-textarea"
                rows={2}
                value={data.browse.pageDescription}
                onChange={(e) => updateBrowse({ pageDescription: e.target.value })}
              />
            </Field>
            <Field label="یادداشت پایین صفحه">
              <textarea
                className="admin-textarea"
                rows={2}
                value={data.browse.footerNote}
                onChange={(e) => updateBrowse({ footerNote: e.target.value })}
              />
            </Field>
          </Card>
          <Card title="چیدمان جدول">
            <div className="admin-grid-2">
              <Field label="مرتب‌سازی پیش‌فرض">
                <select
                  className="admin-select"
                  value={data.browse.defaultSortBy}
                  onChange={(e) =>
                    updateBrowse({ defaultSortBy: e.target.value as BrowseSearchSettings["browse"]["defaultSortBy"] })
                  }
                >
                  <option value="year">سال</option>
                  <option value="title">عنوان</option>
                  <option value="status">وضعیت</option>
                </select>
              </Field>
              <Field label="جهت مرتب‌سازی">
                <select
                  className="admin-select"
                  value={data.browse.defaultSortDir}
                  onChange={(e) =>
                    updateBrowse({ defaultSortDir: e.target.value as BrowseSearchSettings["browse"]["defaultSortDir"] })
                  }
                >
                  <option value="asc">صعودی</option>
                  <option value="desc">نزولی</option>
                </select>
              </Field>
            </div>
            <table className="admin-table" style={{ marginTop: "1rem" }}>
              <thead>
                <tr>
                  <th>ستون</th>
                  <th>برچسب</th>
                  <th>عرض</th>
                  <th className="col-narrow">نمایش</th>
                </tr>
              </thead>
              <tbody>
                {data.browse.columns.map((c, i) => (
                  <tr key={c.id}>
                    <td>
                      <code className="admin-mono admin-muted">{c.id}</code>
                    </td>
                    <td>
                      <input
                        className="admin-input admin-input-sm"
                        value={c.label}
                        onChange={(e) => updateColumn(i, { label: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        className="admin-input admin-input-sm admin-mono"
                        dir="ltr"
                        value={c.width}
                        onChange={(e) => updateColumn(i, { width: e.target.value })}
                      />
                    </td>
                    <td className="col-narrow">
                      <Switch
                        on={c.visible}
                        onChange={(v) => updateColumn(i, { visible: v })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Card title="صفحه‌بندی">
            <div className="admin-row-between">
              <span style={{ fontSize: 13 }}>فعال‌سازی صفحه‌بندی</span>
              <Switch
                on={data.browse.enablePagination}
                onChange={(v) => updateBrowse({ enablePagination: v })}
              />
            </div>
            <Field label="تعداد در هر صفحه">
              <input
                className="admin-input"
                type="number"
                dir="ltr"
                value={data.browse.pageSize ?? 20}
                onChange={(e) => updateBrowse({ pageSize: Number(e.target.value) || null })}
              />
            </Field>
          </Card>
        </div>
      )}

      {tab === "search" && (
        <div className="admin-stack">
          <Card title="مشخصات صفحه">
            <Field label="عنوان">
              <input
                className="admin-input"
                value={data.search.pageTitle}
                onChange={(e) => updateSearch({ pageTitle: e.target.value })}
              />
            </Field>
            <Field label="زیرعنوان">
              <input
                className="admin-input"
                value={data.search.pageSubtitle}
                onChange={(e) => updateSearch({ pageSubtitle: e.target.value })}
              />
            </Field>
            <Field label="متن راهنمای جستجو">
              <input
                className="admin-input"
                value={data.search.searchPlaceholder}
                onChange={(e) => updateSearch({ searchPlaceholder: e.target.value })}
              />
            </Field>
            <div className="admin-grid-2">
              <Field label="تعداد نتایج در هر صفحه">
                <input
                  className="admin-input"
                  type="number"
                  dir="ltr"
                  value={data.search.resultsPageSize}
                  onChange={(e) => updateSearch({ resultsPageSize: Number(e.target.value) || 0 })}
                />
              </Field>
              <Field label="حداکثر پیشنهادها">
                <input
                  className="admin-input"
                  type="number"
                  dir="ltr"
                  value={data.search.suggestionMax}
                  onChange={(e) => updateSearch({ suggestionMax: Number(e.target.value) || 0 })}
                />
              </Field>
            </div>
            <Field label="عنوان حالت خالی">
              <input
                className="admin-input"
                value={data.search.emptyStateTitle}
                onChange={(e) => updateSearch({ emptyStateTitle: e.target.value })}
              />
            </Field>
            <Field label="توضیح حالت خالی">
              <input
                className="admin-input"
                value={data.search.emptyStateDesc}
                onChange={(e) => updateSearch({ emptyStateDesc: e.target.value })}
              />
            </Field>
          </Card>

          <Card title="دامنه جستجو" desc="کدام فیلدها در جستجو لحاظ شوند">
            <div className="admin-grid-2">
              {(Object.keys(data.search.searchScope) as (keyof SearchScope)[]).map((k) => (
                <div key={k} className="admin-row-between" style={{ padding: "0.3rem 0" }}>
                  <span style={{ fontSize: 13 }}>{SCOPE_LABELS[k] ?? k}</span>
                  <Switch
                    on={data.search.searchScope[k]}
                    onChange={(v) => updateScope(k, v)}
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card title="فیلترهای کناری (Facets)">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>فیلتر</th>
                  <th>برچسب</th>
                  <th className="col-narrow">نمایش</th>
                </tr>
              </thead>
              <tbody>
                {data.search.facets.map((f, i) => (
                  <tr key={f.id}>
                    <td>
                      <code className="admin-mono admin-muted">{f.id}</code>
                    </td>
                    <td>
                      <input
                        className="admin-input admin-input-sm"
                        value={f.label}
                        onChange={(e) => updateFacet(i, { label: e.target.value })}
                      />
                    </td>
                    <td className="col-narrow">
                      <Switch
                        on={f.visible}
                        onChange={(v) => updateFacet(i, { visible: v })}
                      />
                    </td>
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
            <Switch
              on={data.search.suggestionEnabled}
              onChange={(v) => updateSearch({ suggestionEnabled: v })}
            />
          </div>
          <Field label="حداکثر تعداد پیشنهادها">
            <input
              className="admin-input"
              type="number"
              dir="ltr"
              value={data.search.suggestionMax}
              onChange={(e) => updateSearch({ suggestionMax: Number(e.target.value) || 0 })}
            />
          </Field>
          <Field label="نمایش تعداد تطبیق‌ها">
            <Switch
              on={data.search.showMatchCounts}
              onChange={(v) => updateSearch({ showMatchCounts: v })}
            />
          </Field>
        </Card>
      )}
    </>
  );
}
