"use client";

import { PageHead, Card, Field, Switch, Segmented } from "@/components/admin/primitives";
import { defaultTheme, type ThemeToken } from "@/lib/admin-data";

export default function AppearanceSettingsPage() {
  const lightInk = defaultTheme.lightTokens.filter((t) => t.group === "ink");
  const lightSurface = defaultTheme.lightTokens.filter((t) => t.group === "surface");
  const lightAccent = defaultTheme.lightTokens.filter((t) => t.group === "accent" || t.group === "layout");
  const darkTokens = defaultTheme.darkTokens;

  return (
    <div className="admin-stack">
      <PageHead title="ظاهر و رنگ" subtitle="ویرایش توکن‌های رنگ، فونت و قالب بصری سایت" actions={<button className="admin-btn admin-btn-primary">ذخیره</button>} />

      <Card title="حالت نمایش پیش‌فرض">
        <Segmented options={[{ value: "light", label: "روشن" }, { value: "dark", label: "تیره" }, { value: "system", label: "سیستم" }]} value={defaultTheme.defaultMode} onChange={() => {}} />
        <div className="admin-muted" style={{ marginTop: "0.5rem" }}>حالتی که کاربر در اولین بازدید می‌بیند.</div>
      </Card>

      <div className="admin-grid-2">
        <Card title="توکن‌های روشن — متن" desc="رنگ‌های متن در حالت روشن">
          <TokenGrid tokens={lightInk} />
        </Card>
        <Card title="توکن‌های روشن — سطوح" desc="رنگ‌های پس‌زمینه">
          <TokenGrid tokens={lightSurface} />
        </Card>
      </div>

      <Card title="توکن‌های روشن — تأکید و چیدمان">
        <TokenGrid tokens={lightAccent} />
      </Card>

      <Card title="توکن‌های تیره">
        <TokenGrid tokens={darkTokens} />
      </Card>

      <div className="admin-grid-2">
        <Card title="فونت و شعاع">
          <Field label="استک فونت" help="فونت پیش‌فرض: Vazirmatn">
            <input className="admin-input admin-mono" dir="ltr" defaultValue={defaultTheme.fontStack} />
          </Field>
          <Field label="شعاع گوشه (radius)">
            <input className="admin-input admin-mono" dir="ltr" defaultValue={defaultTheme.radius} />
          </Field>
        </Card>

        <Card title="رنگ‌های نشان وضعیت" desc="رنگ پس‌زمینه و متن نشان‌های وضعیت قانون">
          <div className="admin-stack-sm">
            {defaultTheme.statusBadges.map((b) => (
              <div key={b.status} className="admin-row">
                <div style={{ width: 80, fontSize: 12 }}>{b.label}</div>
                <ColorInput defaultValue={b.color} label="متن" />
                <ColorInput defaultValue={b.bgColor} label="پس‌زمینه" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="رنگ‌های نوع اثر اصلاح" desc="هر نوع اثر اصلاح در خط زمانی">
        <div className="admin-wrap">
          {defaultTheme.effectTypeColors.map((e) => (
            <div key={e.type} className="admin-row">
              <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: e.color }} />
              <span style={{ fontSize: 12 }}>{e.type}</span>
              <input type="color" defaultValue={e.color} style={{ width: 28, height: 24, border: "1px solid var(--admin-border)", borderRadius: 3, background: "transparent", cursor: "pointer" }} />
            </div>
          ))}
        </div>
      </Card>

      {/* Live preview */}
      <Card title="پیش‌نمایش زنده">
        <div style={{ borderRadius: 6, overflow: "hidden", border: "1px solid var(--admin-border)" }}>
          <div style={{ padding: "1.5rem", backgroundColor: "#ffffff", color: "#1a1a1a" }}>
            <div style={{ fontSize: 11, color: "#6b6b6b", marginBottom: "0.25rem", letterSpacing: "0.06em" }}>مرجع قوانین</div>
            <h2 style={{ fontSize: 22, fontWeight: 300, marginBottom: "0.5rem" }}>قانون مدنی</h2>
            <p style={{ fontSize: 14, color: "#3d3d3d", lineHeight: 1.7 }}>مجموعه‌ای از قواعد حقوقی که روابط خصوصی اشخاص را تنظیم می‌کند.</p>
            <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 2, backgroundColor: "#f4f3f0", color: "#2b2b2b" }}>لازم‌الاجرا</span>
              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 2, backgroundColor: "#ececea", color: "#5a5a5a" }}>اصلاح‌شده</span>
            </div>
            <button style={{ marginTop: "1rem", fontSize: 13, padding: "0.5rem 1rem", backgroundColor: "#2b2b2b", color: "#fff", border: "none", borderRadius: 2, cursor: "pointer" }}>مشاهده قانون</button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function TokenGrid({ tokens }: { tokens: ThemeToken[] }) {
  return (
    <div className="admin-grid-2" style={{ gap: "0.5rem" }}>
      {tokens.map((t) => (
        <div key={t.key} className="admin-row" style={{ justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--admin-ink)" }}>{t.label}</div>
            <code className="admin-mono admin-muted" dir="ltr" style={{ fontSize: 10 }}>{t.key}</code>
          </div>
          <ColorInput defaultValue={t.value} />
        </div>
      ))}
    </div>
  );
}

function ColorInput({ defaultValue, label }: { defaultValue: string; label?: string }) {
  return (
    <div className="admin-color-input">
      {label && <span className="admin-muted" style={{ fontSize: 11 }}>{label}</span>}
      <input type="color" defaultValue={defaultValue} />
      <input className="admin-input admin-input-sm admin-mono" dir="ltr" defaultValue={defaultValue} style={{ width: 80 }} />
    </div>
  );
}
