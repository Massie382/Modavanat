"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHead, StatTile, Card, Badge, Notice, faNum } from "@/components/admin/primitives";

interface DashboardData {
  stats: {
    totalUsers: number;
    totalAdmins: number;
    totalLaws: number;
    totalArticles: number;
    totalAmendments: number;
    totalReferences: number;
  };
  ticketsByStatus: { open: number; pending: number; closed: number };
  purchasesSummary: {
    total: number;
    paid: number;
    pending: number;
    refunded: number;
    failed: number;
    revenue: number;
  };
  totalBookmarks: number;
  recentActivity: Array<{
    id: string;
    actorEmail: string | null;
    actorName: string | null;
    action: string;
    targetType: string | null;
    targetId: string | null;
    createdAt: string;
  }>;
  lawTypeDistribution: { name: string; value: number; color: string }[];
  monthlyVisits: null;
  topSearchedLaws: null;
  notifications: never[];
}

function faDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("fa-IR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function auditToActivity(a: DashboardData["recentActivity"][number]): {
  type: "law" | "user" | "content" | "settings" | "auth";
  actor: string;
  action: string;
  target: string;
  at: string;
} {
  // Map audit `action` keys (e.g. "admin.user.create", "user.login.success")
  // to the type-bucket the dashboard card renders.
  const a_lower = a.action.toLowerCase();
  let type: "law" | "user" | "content" | "settings" | "auth" = "user";
  if (a_lower.startsWith("admin.user") || a_lower.startsWith("user.")) type = "user";
  else if (a_lower.includes("law") || a.targetType === "law") type = "law";
  else if (a.targetType === "ticket" || a.targetType === "purchase" || a.targetType === "bookmark") type = "content";
  else if (a.targetType === "settings") type = "settings";
  else if (a_lower.includes("login") || a_lower.includes("signup") || a_lower.includes("password") || a_lower.includes("auth")) type = "auth";
  return {
    type,
    actor: a.actorName || a.actorEmail || "سیستم",
    action: a.action,
    target: a.targetId ?? "—",
    at: faDate(a.createdAt),
  };
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/dashboard", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as DashboardData;
        if (!cancelled) {
          setData(json);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "خطا در بارگذاری آمار");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const recentActivity = data?.recentActivity.map(auditToActivity) ?? [];
  const ticketsByStatus = data?.ticketsByStatus;
  const openTickets = ticketsByStatus?.open ?? 0;
  const pendingTickets = ticketsByStatus?.pending ?? 0;
  const closedTickets = ticketsByStatus?.closed ?? 0;

  return (
    <>
      <PageHead
        title="داشبورد مدیریت"
        subtitle="نمای کلی وضعیت پایگاه، قوانین، کاربران و فعالیت‌ها"
        actions={
          <>
            <Link href="/admin/laws/new" className="admin-btn admin-btn-primary">+ افزودن قانون</Link>
            <Link href="/" target="_blank" className="admin-btn admin-btn-ghost">مشاهده سایت</Link>
          </>
        }
      />

      <Notice variant="info">
        به پنل مدیریت مدونات خوش آمدید. از اینجا می‌توانید تمام جنبه‌های پایگاه — قوانین، صفحات، کاربران و تنظیمات — را مدیریت کنید.
      </Notice>

      {loading && (
        <Notice variant="info">در حال بارگذاری…</Notice>
      )}

      {/* Stat grid */}
      <div className="admin-stat-grid">
        <StatTile label="کل قوانین" value={data ? faNum(data.stats.totalLaws) : "…"} />
        <StatTile label="مواد قانونی" value={data ? faNum(data.stats.totalArticles) : "…"} />
        <StatTile label="اصلاحات ثبت‌شده" value={data ? faNum(data.stats.totalAmendments) : "…"} />
        <StatTile label="ارجاعات متقابل" value={data ? faNum(data.stats.totalReferences) : "…"} />
        <StatTile label="نشانه‌گذاری‌ها" value={data ? faNum(data.totalBookmarks) : "…"} />
        <StatTile label="کاربران پایگاه" value={data ? faNum(data.stats.totalUsers) : "…"} />
        <StatTile label="مدیران" value={data ? faNum(data.stats.totalAdmins) : "…"} />
        <StatTile label="تیکت‌های باز" value={data ? faNum(openTickets) : "…"} delta={pendingTickets > 0 ? `${faNum(pendingTickets)} در انتظار` : undefined} deltaDir="down" />
      </div>

      {error && (
        <Notice variant="warning">
          بارگذاری آمار ناموفق بود: {error}
        </Notice>
      )}

      <div className="admin-grid-2">
        {/* Law type distribution — REAL data */}
        <Card title="توزیع انواع قوانین" desc="ترکیب قوانین بر اساس نوع (درصد)">
          {data && data.lawTypeDistribution.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "0.5rem 0" }}>
              {data.lawTypeDistribution.map((t) => (
                <div key={t.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem", fontSize: 12 }}>
                    <span style={{ color: "var(--admin-ink)" }}>{t.name}</span>
                    <span style={{ color: "var(--admin-ink-muted)" }}>{faNum(t.value)}٪</span>
                  </div>
                  <div style={{ height: 6, backgroundColor: "var(--admin-surface-sunken)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${t.value}%`, height: "100%", backgroundColor: t.color }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="admin-muted">داده‌ای موجود نیست.</div>
          )}
        </Card>

        {/* Visits chart — analytics not tracked yet */}
        <Card title="بازدید ماهانه" desc="بازدید کاربران در ۶ ماه گذشته (نیازمند راه‌اندازی سیستم تحلیل)">
          <div className="admin-muted" style={{ padding: "2rem 0", textAlign: "center" }}>
            داده‌ٔ بازدید هنوز راه‌اندازی نشده است.
          </div>
        </Card>
      </div>

      <div className="admin-grid-2" style={{ marginTop: "1rem" }}>
        {/* Recent activity — REAL audit log */}
        <Card title="فعالیت‌های اخیر" desc="آخرین رویدادهای ثبت‌شده در لاگ ممیزی">
          {recentActivity.length > 0 ? (
            <div className="admin-stack-sm">
              {recentActivity.slice(0, 6).map((a) => (
                <div key={a.at + a.action} style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start", padding: "0.5rem 0", borderBottom: "1px solid var(--admin-border-soft)" }}>
                  <Badge variant={a.type === "law" ? "accent" : a.type === "user" ? "info" : a.type === "content" ? "success" : a.type === "settings" ? "warning" : "neutral"}>
                    {a.type === "law" ? "قانون" : a.type === "user" ? "کاربر" : a.type === "content" ? "محتوا" : a.type === "settings" ? "تنظیمات" : "احراز"}
                  </Badge>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, color: "var(--admin-ink)", direction: "ltr", textAlign: "right", wordBreak: "break-all" }}>
                      <strong style={{ fontWeight: 600 }}>{a.actor}</strong> <code className="admin-mono">{a.action}</code>{" "}
                      {a.target !== "—" && <span style={{ color: "var(--admin-accent)" }} dir="ltr">{a.target}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--admin-ink-muted)", marginTop: 2 }}>{a.at}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="admin-muted" style={{ padding: "1.5rem 0", textAlign: "center" }}>رویدادی ثبت نشده است.</div>
          )}
          <div style={{ marginTop: "0.75rem" }}>
            <Link href="/admin/activity" className="admin-btn admin-btn-sm admin-btn-ghost">مشاهده همه ←</Link>
          </div>
        </Card>

        {/* Support tiles */}
        <Card title="وضعیت پشتیبانی" desc="تیکت‌ها بر اساس وضعیت">
          <div className="admin-stat-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
            <StatTile label="باز" value={data ? faNum(openTickets) : "…"} />
            <StatTile label="در حال بررسی" value={data ? faNum(pendingTickets) : "…"} />
            <StatTile label="بسته" value={data ? faNum(closedTickets) : "…"} />
          </div>
          <div style={{ marginTop: "1rem" }}>
            <Link href="/admin/tickets" className="admin-btn admin-btn-sm admin-btn-ghost">مدیریت تیکت‌ها ←</Link>
          </div>
        </Card>
      </div>

      {/* Top searched — analytics not tracked yet */}
      <Card title="پربازدیدترین قوانین" desc="پر جستجوترین قوانین (نیازمند راه‌اندازی سیستم تحلیل)" style={{ marginTop: "1rem" }}>
        <div className="admin-muted" style={{ padding: "2rem 0", textAlign: "center" }}>
          آمار جستجو هنوز راه‌اندازی نشده است.
        </div>
      </Card>
    </>
  );
}
