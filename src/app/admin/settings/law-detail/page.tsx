"use client";

import { PageHead, Card, Field, Switch, Notice } from "@/components/admin/primitives";
import { useToast } from "@/hooks/use-toast";

// Phase 7 — frontend only. Law-detail settings will be persisted via
// /api/admin/settings?key=law-detail (scaffolded) but the form below
// is not yet wired to read/write that endpoint.
const lawDetailMock = {
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
  return (
    <div className="admin-stack">
      <PageHead title="تنظیمات صفحه قانون" subtitle="تب‌ها، دکمه‌ها، شبکه متادیتا و قالب ارجاع" actions={<button className="admin-btn admin-btn-primary" onClick={() => toast({ title: "اطلاع", description: "ذخیره در فاز ۷." })}>ذخیره</button>} />

      <Notice variant="warning">Phase 7 — frontend only.</Notice>

      <Card title="تب‌های صفحه قانون">
        <table className="admin-table">
          <thead><tr><th>تب</th><th>برچسب</th><th>متن راهنما</th><th className="col-narrow">نمایش</th><th className="col-narrow">ترتیب</th></tr></thead>
          <tbody>
            {lawDetailMock.tabs.map((t) => (
              <tr key={t.id}>
                <td><code className="admin-mono admin-muted">{t.id}</code></td>
                <td><input className="admin-input admin-input-sm" defaultValue={t.label} /></td>
                <td><input className="admin-input admin-input-sm" defaultValue={t.helpText} /></td>
                <td className="col-narrow"><Switch on={t.visible} onChange={() => {}} /></td>
                <td className="col-narrow">
                  <button className="admin-btn admin-btn-sm admin-btn-ghost">↑</button>
                  <button className="admin-btn admin-btn-sm admin-btn-ghost">↓</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="admin-grid-2">
        <Card title="دکمه‌های کاربردی">
          <div className="admin-stack-sm">
            {lawDetailMock.utilityButtons.map((b) => (
              <div key={b.id} className="admin-row-between">
                <span style={{ fontSize: 13 }}>{b.label}</span>
                <Switch on={b.visible} onChange={() => {}} />
              </div>
            ))}
          </div>
        </Card>
        <Card title="شبکه متادیتا">
          <div className="admin-stack-sm">
            {lawDetailMock.metadataGrid.map((m) => (
              <div key={m.id} className="admin-row-between">
                <span style={{ fontSize: 13 }}>{m.label}</span>
                <Switch on={m.visible} onChange={() => {}} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="سایر تنظیمات نمایش">
        <div className="admin-stack-sm">
          <div className="admin-row-between">
            <div><div style={{ fontSize: 13 }}>نمایش هشدار تغییرات معوق</div><div className="admin-muted">هشدار زرد بالای صفحه</div></div>
            <Switch on={lawDetailMock.showOutstandingChangesNotice} onChange={() => {}} />
          </div>
          <div className="admin-row-between">
            <div><div style={{ fontSize: 13 }}>نمایش Breadcrumb</div></div>
            <Switch on={lawDetailMock.showBreadcrumb} onChange={() => {}} />
          </div>
          <div className="admin-row-between">
            <div><div style={{ fontSize: 13 }}>نمایش تغییر نسخه (اصلی/اصلاح‌شده)</div></div>
            <Switch on={lawDetailMock.showVersionToggle} onChange={() => {}} />
          </div>
          <div className="admin-row-between">
            <div><div style={{ fontSize: 13 }}>نمایش نمودار شبکه ارجاعات</div></div>
            <Switch on={lawDetailMock.networkVisualization} onChange={() => {}} />
          </div>
        </div>
      </Card>

      <Card title="قالب ارجاع‌دهی">
        <Field label="قالب متن ارجاع" help="متغیرها: {title}, {approvedDate}, {promulgatingAuthority}, {siteName}">
          <textarea className="admin-textarea" defaultValue={lawDetailMock.citationTemplate} rows={2} />
        </Field>
      </Card>

      <Card title="منابع خارجی" desc="لینک‌های نمایش‌داده‌شده در تب منابع بیشتر">
        <table className="admin-table">
          <thead><tr><th>برچسب</th><th>آدرس</th><th className="col-narrow">نمایش</th></tr></thead>
          <tbody>
            {lawDetailMock.externalResources.map((r) => (
              <tr key={r.id}>
                <td><input className="admin-input admin-input-sm" defaultValue={r.label} /></td>
                <td><input className="admin-input admin-input-sm admin-mono" dir="ltr" defaultValue={r.href} /></td>
                <td className="col-narrow"><Switch on={r.visible} onChange={() => {}} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="مراحل بعدی">
        <table className="admin-table">
          <thead><tr><th>برچسب</th><th>آدرس</th><th className="col-narrow">نمایش</th></tr></thead>
          <tbody>
            {lawDetailMock.nextSteps.map((r) => (
              <tr key={r.id}>
                <td><input className="admin-input admin-input-sm" defaultValue={r.label} /></td>
                <td><input className="admin-input admin-input-sm admin-mono" dir="ltr" defaultValue={r.href} /></td>
                <td className="col-narrow"><Switch on={r.visible} onChange={() => {}} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="مواد دارای اهمیت">
        <Field label="تعداد مواد نمایش‌داده‌شده در تب منابع"><input className="admin-input" type="number" defaultValue={lawDetailMock.importantArticlesCount} dir="ltr" /></Field>
      </Card>
    </div>
  );
}
