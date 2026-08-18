"use client";

import { PageHead, Card, Field, Switch, Notice } from "@/components/admin/primitives";
import { useToast } from "@/hooks/use-toast";
import { useAdminSettings } from "@/hooks/use-admin-settings";

// Phase 7 — wired to /api/admin/settings?key=law-detail.
interface LawDetailSettings {
  tabs: { id: string; label: string; visible: boolean; helpText: string }[];
  utilityButtons: { id: string; label: string; visible: boolean }[];
  metadataGrid: { id: string; label: string; visible: boolean }[];
  showOutstandingChangesNotice: boolean;
  showBreadcrumb: boolean;
  showVersionToggle: boolean;
  citationTemplate: string;
  importantArticlesCount: number;
  externalResources: { id: string; label: string; href: string; visible: boolean }[];
  nextSteps: { id: string; label: string; href: string; visible: boolean }[];
  networkVisualization: boolean;
}

const defaults: LawDetailSettings = {
  tabs: [
    { id: "contents", label: "فهرست مطالب", visible: true, helpText: "" },
    { id: "content", label: "متن قانون", visible: true, helpText: "" },
    { id: "timeline", label: "خط زمانی اصلاحات", visible: true, helpText: "تاریخچه کامل اصلاحات اعمال‌شده بر این قانون" },
    { id: "references", label: "ارجاعات", visible: true, helpText: "فهرست ارجاعات متقابل با سایر قوانین" },
    { id: "resources", label: "منابع بیشتر", visible: true, helpText: "منابع مرتبط شامل نسخه اصلی و منابع خارجی" },
  ],
  utilityButtons: [
    { id: "print", label: "چاپ", visible: true },
    { id: "pdf", label: "دانلود PDF", visible: true },
    { id: "rss", label: "اشتراک RSS", visible: true },
  ],
  metadataGrid: [
    { id: "approved", label: "تاریخ تصویب", visible: true },
    { id: "effective", label: "تاریخ اجرا", visible: true },
    { id: "revision", label: "آخرین بازنگری", visible: true },
    { id: "articles", label: "تعداد مواد", visible: true },
  ],
  showOutstandingChangesNotice: true,
  showBreadcrumb: true,
  showVersionToggle: true,
  citationTemplate: "{title} — مصوب {approvedDate} — مرجع: {promulgatingAuthority} — {siteName}",
  importantArticlesCount: 8,
  externalResources: [
    { id: "er1", label: "مجلس شورای اسلامی", href: "#", visible: true },
    { id: "er2", label: "روزنامه رسمی", href: "#", visible: true },
    { id: "er3", label: "آرا و مذاکرات", href: "#", visible: true },
    { id: "er4", label: "نظرات شورای نگهبان", href: "#", visible: true },
  ],
  nextSteps: [
    { id: "ns1", label: "مشاهده نسخه اصلی", href: "#", visible: true },
    { id: "ns2", label: "مشاهده ارجاعات", href: "#", visible: true },
    { id: "ns3", label: "خروجی PDF", href: "#", visible: true },
    { id: "ns4", label: "اشتراک‌گذاری", href: "#", visible: true },
  ],
  networkVisualization: true,
};

export default function LawDetailSettingsPage() {
  const { toast } = useToast();
  const { data, setData, loading, error, saving, save } =
    useAdminSettings<LawDetailSettings>("law-detail", defaults);

  const onSave = async () => {
    const ok = await save();
    toast({
      title: ok ? "ذخیره شد" : "خطا",
      description: ok ? "تنظیمات صفحه قانون ذخیره شد." : error ?? "خطا در ذخیره",
    });
  };

  const updateTab = (i: number, patch: Partial<LawDetailSettings["tabs"][number]>) => {
    const next = [...data.tabs];
    next[i] = { ...next[i], ...patch };
    setData({ ...data, tabs: next });
  };
  const updateUtil = (i: number, visible: boolean) => {
    const next = [...data.utilityButtons];
    next[i] = { ...next[i], visible };
    setData({ ...data, utilityButtons: next });
  };
  const updateMeta = (i: number, visible: boolean) => {
    const next = [...data.metadataGrid];
    next[i] = { ...next[i], visible };
    setData({ ...data, metadataGrid: next });
  };
  const updateExternal = (i: number, patch: Partial<LawDetailSettings["externalResources"][number]>) => {
    const next = [...data.externalResources];
    next[i] = { ...next[i], ...patch };
    setData({ ...data, externalResources: next });
  };
  const updateNextStep = (i: number, patch: Partial<LawDetailSettings["nextSteps"][number]>) => {
    const next = [...data.nextSteps];
    next[i] = { ...next[i], ...patch };
    setData({ ...data, nextSteps: next });
  };

  return (
    <div className="admin-stack">
      <PageHead
        title="تنظیمات صفحه قانون"
        subtitle="تب‌ها، دکمه‌ها، شبکه متادیتا و قالب ارجاع"
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

      <Card title="تب‌های صفحه قانون">
        <table className="admin-table">
          <thead>
            <tr>
              <th>تب</th>
              <th>برچسب</th>
              <th>متن راهنما</th>
              <th className="col-narrow">نمایش</th>
            </tr>
          </thead>
          <tbody>
            {data.tabs.map((t, i) => (
              <tr key={t.id}>
                <td>
                  <code className="admin-mono admin-muted">{t.id}</code>
                </td>
                <td>
                  <input
                    className="admin-input admin-input-sm"
                    value={t.label}
                    onChange={(e) => updateTab(i, { label: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    className="admin-input admin-input-sm"
                    value={t.helpText}
                    onChange={(e) => updateTab(i, { helpText: e.target.value })}
                  />
                </td>
                <td className="col-narrow">
                  <Switch on={t.visible} onChange={(v) => updateTab(i, { visible: v })} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="admin-grid-2">
        <Card title="دکمه‌های کاربردی">
          <div className="admin-stack-sm">
            {data.utilityButtons.map((b, i) => (
              <div key={b.id} className="admin-row-between">
                <span style={{ fontSize: 13 }}>{b.label}</span>
                <Switch on={b.visible} onChange={(v) => updateUtil(i, v)} />
              </div>
            ))}
          </div>
        </Card>
        <Card title="شبکه متادیتا">
          <div className="admin-stack-sm">
            {data.metadataGrid.map((m, i) => (
              <div key={m.id} className="admin-row-between">
                <span style={{ fontSize: 13 }}>{m.label}</span>
                <Switch on={m.visible} onChange={(v) => updateMeta(i, v)} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="سایر تنظیمات نمایش">
        <div className="admin-stack-sm">
          <div className="admin-row-between">
            <div>
              <div style={{ fontSize: 13 }}>نمایش هشدار تغییرات معوق</div>
              <div className="admin-muted">هشدار زرد بالای صفحه</div>
            </div>
            <Switch
              on={data.showOutstandingChangesNotice}
              onChange={(v) => setData({ ...data, showOutstandingChangesNotice: v })}
            />
          </div>
          <div className="admin-row-between">
            <div>
              <div style={{ fontSize: 13 }}>نمایش Breadcrumb</div>
            </div>
            <Switch
              on={data.showBreadcrumb}
              onChange={(v) => setData({ ...data, showBreadcrumb: v })}
            />
          </div>
          <div className="admin-row-between">
            <div>
              <div style={{ fontSize: 13 }}>نمایش تغییر نسخه (اصلی/اصلاح‌شده)</div>
            </div>
            <Switch
              on={data.showVersionToggle}
              onChange={(v) => setData({ ...data, showVersionToggle: v })}
            />
          </div>
          <div className="admin-row-between">
            <div>
              <div style={{ fontSize: 13 }}>نمایش نمودار شبکه ارجاعات</div>
            </div>
            <Switch
              on={data.networkVisualization}
              onChange={(v) => setData({ ...data, networkVisualization: v })}
            />
          </div>
        </div>
      </Card>

      <Card title="قالب ارجاع‌دهی">
        <Field
          label="قالب متن ارجاع"
          help="متغیرها: {title}, {approvedDate}, {promulgatingAuthority}, {siteName}"
        >
          <textarea
            className="admin-textarea"
            rows={2}
            value={data.citationTemplate}
            onChange={(e) => setData({ ...data, citationTemplate: e.target.value })}
          />
        </Field>
      </Card>

      <Card title="منابع خارجی" desc="لینک‌های نمایش‌داده‌شده در تب منابع بیشتر">
        <table className="admin-table">
          <thead>
            <tr>
              <th>برچسب</th>
              <th>آدرس</th>
              <th className="col-narrow">نمایش</th>
            </tr>
          </thead>
          <tbody>
            {data.externalResources.map((r, i) => (
              <tr key={r.id}>
                <td>
                  <input
                    className="admin-input admin-input-sm"
                    value={r.label}
                    onChange={(e) => updateExternal(i, { label: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    className="admin-input admin-input-sm admin-mono"
                    dir="ltr"
                    value={r.href}
                    onChange={(e) => updateExternal(i, { href: e.target.value })}
                  />
                </td>
                <td className="col-narrow">
                  <Switch
                    on={r.visible}
                    onChange={(v) => updateExternal(i, { visible: v })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="مراحل بعدی">
        <table className="admin-table">
          <thead>
            <tr>
              <th>برچسب</th>
              <th>آدرس</th>
              <th className="col-narrow">نمایش</th>
            </tr>
          </thead>
          <tbody>
            {data.nextSteps.map((r, i) => (
              <tr key={r.id}>
                <td>
                  <input
                    className="admin-input admin-input-sm"
                    value={r.label}
                    onChange={(e) => updateNextStep(i, { label: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    className="admin-input admin-input-sm admin-mono"
                    dir="ltr"
                    value={r.href}
                    onChange={(e) => updateNextStep(i, { href: e.target.value })}
                  />
                </td>
                <td className="col-narrow">
                  <Switch
                    on={r.visible}
                    onChange={(v) => updateNextStep(i, { visible: v })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="مواد دارای اهمیت">
        <Field label="تعداد مواد نمایش‌داده‌شده در تب منابع">
          <input
            className="admin-input"
            type="number"
            dir="ltr"
            value={data.importantArticlesCount}
            onChange={(e) =>
              setData({ ...data, importantArticlesCount: Number(e.target.value) || 0 })
            }
          />
        </Field>
      </Card>
    </div>
  );
}
