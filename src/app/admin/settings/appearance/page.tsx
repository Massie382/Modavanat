"use client";

import { PageHead, Card, Field, Switch, Segmented, Notice } from "@/components/admin/primitives";
import { useToast } from "@/hooks/use-toast";

// Phase 7 — frontend only. Theme tokens will be persisted via
// /api/admin/settings?key=appearance (scaffolded) but the form below
// is not yet wired to read/write that endpoint.
interface ThemeToken {
  key: string;
  label: string;
  value: string;
  group: "color" | "surface" | "ink" | "accent" | "badge" | "layout";
}

const themeMock: {
  defaultMode: "light" | "dark" | "system";
  radius: string;
  fontStack: string;
  lightTokens: ThemeToken[];
  darkTokens: ThemeToken[];
  statusBadges: { status: string; label: string; color: string; bgColor: string }[];
  effectTypeColors: { type: string; color: string }[];
} = {
  defaultMode: "light",
  radius: "0.25rem",
  fontStack: '"vazirmatn", "Tahoma", "Arial", sans-serif',
  lightTokens: [
    { key: "--ink", label: "متن اصلی", value: "#1a1a1a", group: "ink" },
    { key: "--ink-soft", label: "مطمئن", value: "#3d3d3d", group: "ink" },
    { key: "--ink-muted", label: "خاکستری", value: "#6b6b6b", group: "ink" },
    { key: "--rule", label: "خط مرزی", value: "#d8d6d2", group: "layout" },
    { key: "--rule-soft", label: "خط نرم", value: "#ececea", group: "layout" },
    { key: "--surface", label: "سطح", value: "#ffffff", group: "surface" },
    { key: "--surface-raised", label: "سطح برجسته", value: "#fafaf8", group: "surface" },
    { key: "--surface-sunken", label: "سطح فرورفته", value: "#f4f3f0", group: "surface" },
    { key: "--charcoal", label: "زغالی", value: "#2b2b2b", group: "accent" },
    { key: "--charcoal-deep", label: "زغالی تیره", value: "#1f1f1f", group: "accent" },
    { key: "--accent-stripe", label: "نوار تأکید", value: "#8a8a8a", group: "accent" },
    { key: "--link", label: "پیوند", value: "#1a1a1a", group: "accent" },
    { key: "--link-hover", label: "پیوند (هاور)", value: "#000000", group: "accent" },
    { key: "--marker", label: "نشانگر F", value: "#2b2b2b", group: "accent" },
  ],
  darkTokens: [
    { key: "--ink", label: "متن اصلی", value: "#e8eaed", group: "ink" },
    { key: "--ink-soft", label: "مطمئن", value: "#a8aeb8", group: "ink" },
    { key: "--ink-muted", label: "خاکستری", value: "#6b7280", group: "ink" },
    { key: "--surface", label: "سطح", value: "#171a21", group: "surface" },
    { key: "--surface-raised", label: "سطح برجسته", value: "#1d2129", group: "surface" },
    { key: "--charcoal", label: "زغالی", value: "#0f1115", group: "accent" },
    { key: "--link", label: "پیوند", value: "#d4a574", group: "accent" },
  ],
  statusBadges: [
    { status: "in-force", label: "لازم‌الاجرا", color: "#2b2b2b", bgColor: "#f4f3f0" },
    { status: "amended", label: "اصلاح‌شده", color: "#5a5a5a", bgColor: "#ececea" },
    { status: "revoked", label: "منسوخ", color: "#7a7a7a", bgColor: "#f0efeb" },
    { status: "pending", label: "در انتظار", color: "#c08a3e", bgColor: "#faf0e0" },
  ],
  effectTypeColors: [
    { type: "اصلاح", color: "#d4a574" },
    { type: "افزوده", color: "#4a7c4a" },
    { type: "حذف", color: "#b85c5c" },
    { type: "جایگزینی", color: "#4a6c8a" },
    { type: "الحاق", color: "#7a5c8a" },
    { type: "توضیح", color: "#8a8a8a" },
    { type: "اجرا", color: "#2b5e2b" },
    { type: "تفویض اختیار", color: "#8a5c2b" },
  ],
};

export default function AppearanceSettingsPage() {
  const { toast } = useToast();
  const lightInk = themeMock.lightTokens.filter((t) => t.group === "ink");
  const lightSurface = themeMock.lightTokens.filter((t) => t.group === "surface");
  const lightAccent = themeMock.lightTokens.filter((t) => t.group === "accent" || t.group === "layout");
  const darkTokens = themeMock.darkTokens;

  return (
    <div className="admin-stack">
      <PageHead title="ظاهر و رنگ" subtitle="ویرایش توکن‌های رنگ، فونت و قالب بصری سایت" actions={<button className="admin-btn admin-btn-primary" onClick={() => toast({ title: "اطلاع", description: "ذخیره در فاز ۷." })}>ذخیره</button>} />

      <Notice variant="warning">Phase 7 — frontend only.</Notice>

      <Card title="حالت نمایش پیش‌فرض">
        <Segmented options={[{ value: "light", label: "روشن" }, { value: "dark", label: "تیره" }, { value: "system", label: "سیستم" }]} value={themeMock.defaultMode} onChange={() => {}} />
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
            <input className="admin-input admin-mono" dir="ltr" defaultValue={themeMock.fontStack} />
          </Field>
          <Field label="شعاع گوشه (radius)">
            <input className="admin-input admin-mono" dir="ltr" defaultValue={themeMock.radius} />
          </Field>
        </Card>

        <Card title="رنگ‌های نشان وضعیت" desc="رنگ پس‌زمینه و متن نشان‌های وضعیت قانون">
          <div className="admin-stack-sm">
            {themeMock.statusBadges.map((b) => (
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
          {themeMock.effectTypeColors.map((e) => (
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
