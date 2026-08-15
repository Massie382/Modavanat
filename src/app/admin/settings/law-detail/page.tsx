"use client";

import { PageHead, Card, Field, Switch } from "@/components/admin/primitives";
import { useToast } from "@/hooks/use-toast";
import { defaultLawDetailSettings } from "@/lib/admin-data";

export default function LawDetailSettingsPage() {
  const { toast } = useToast();
  return (
    <div className="admin-stack">
      <PageHead title="تنظیمات صفحه قانون" subtitle="تب‌ها، دکمه‌ها، شبکه متادیتا و قالب ارجاع" actions={<button className="admin-btn admin-btn-primary" onClick={() => toast({ title: "ذخیره شد", description: "تنظیمات با موفقیت ثبت شد." })}>ذخیره</button>} />

      <Card title="تب‌های صفحه قانون">
        <table className="admin-table">
          <thead><tr><th>تب</th><th>برچسب</th><th>متن راهنما</th><th className="col-narrow">نمایش</th><th className="col-narrow">ترتیب</th></tr></thead>
          <tbody>
            {defaultLawDetailSettings.tabs.map((t) => (
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
            {defaultLawDetailSettings.utilityButtons.map((b) => (
              <div key={b.id} className="admin-row-between">
                <span style={{ fontSize: 13 }}>{b.label}</span>
                <Switch on={b.visible} onChange={() => {}} />
              </div>
            ))}
          </div>
        </Card>
        <Card title="شبکه متادیتا">
          <div className="admin-stack-sm">
            {defaultLawDetailSettings.metadataGrid.map((m) => (
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
            <Switch on={defaultLawDetailSettings.showOutstandingChangesNotice} onChange={() => {}} />
          </div>
          <div className="admin-row-between">
            <div><div style={{ fontSize: 13 }}>نمایش Breadcrumb</div></div>
            <Switch on={defaultLawDetailSettings.showBreadcrumb} onChange={() => {}} />
          </div>
          <div className="admin-row-between">
            <div><div style={{ fontSize: 13 }}>نمایش تغییر نسخه (اصلی/اصلاح‌شده)</div></div>
            <Switch on={defaultLawDetailSettings.showVersionToggle} onChange={() => {}} />
          </div>
          <div className="admin-row-between">
            <div><div style={{ fontSize: 13 }}>نمایش نمودار شبکه ارجاعات</div></div>
            <Switch on={defaultLawDetailSettings.networkVisualization} onChange={() => {}} />
          </div>
        </div>
      </Card>

      <Card title="قالب ارجاع‌دهی">
        <Field label="قالب متن ارجاع" help="متغیرها: {title}, {approvedDate}, {promulgatingAuthority}, {siteName}">
          <textarea className="admin-textarea" defaultValue={defaultLawDetailSettings.citationTemplate} rows={2} />
        </Field>
      </Card>

      <Card title="منابع خارجی" desc="لینک‌های نمایش‌داده‌شده در تب منابع بیشتر">
        <table className="admin-table">
          <thead><tr><th>برچسب</th><th>آدرس</th><th className="col-narrow">نمایش</th></tr></thead>
          <tbody>
            {defaultLawDetailSettings.externalResources.map((r) => (
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
            {defaultLawDetailSettings.nextSteps.map((r) => (
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
        <Field label="تعداد مواد نمایش‌داده‌شده در تب منابع"><input className="admin-input" type="number" defaultValue={defaultLawDetailSettings.importantArticlesCount} dir="ltr" /></Field>
      </Card>
    </div>
  );
}
