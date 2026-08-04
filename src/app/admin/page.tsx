"use client";

import Link from "next/link";
import { PageHead, StatTile, Card, Badge, Notice } from "@/components/admin/primitives";
import { siteStats, monthlyVisits, lawTypeDistribution, topSearchedLaws, defaultActivity, defaultNotifications } from "@/lib/admin-data";
import { faNum } from "@/components/admin/primitives";

export default function AdminDashboard() {
  const maxVisits = Math.max(...monthlyVisits.map((m) => m.visits));
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

      {/* Stat grid */}
      <div className="admin-stat-grid">
        <StatTile label="کل قوانین" value={faNum(siteStats.totalLaws)} delta="۲ قانون این هفته" deltaDir="up" />
        <StatTile label="مواد قانونی" value={faNum(siteStats.totalArticles)} />
        <StatTile label="اصلاحات ثبت‌شده" value={faNum(siteStats.totalAmendments)} />
        <StatTile label="ارجاعات متقابل" value={faNum(siteStats.totalReferences)} />
        <StatTile label="فایل‌های PDF" value={faNum(siteStats.totalPdfs)} />
        <StatTile label="کاربران پایگاه" value={faNum(siteStats.totalUsers)} delta="۴ کاربر جدید" deltaDir="up" />
        <StatTile label="تیکت‌های باز" value={faNum(siteStats.openTickets)} delta="نیاز به پاسخ" deltaDir="down" />
        <StatTile label="خریدها" value={faNum(siteStats.totalPurchases)} />
      </div>

      <div className="admin-grid-2">
        {/* Visits chart */}
        <Card title="بازدید ماهانه" desc="بازدید کاربران و قوانین جدید در ۶ ماه گذشته">
          <div style={{ display: "flex", alignItems: "flex-end", gap: "0.75rem", height: 180, padding: "0.5rem 0" }}>
            {monthlyVisits.map((m) => (
              <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem" }}>
                <div style={{ fontSize: 10, color: "var(--admin-ink-muted)" }}>{faNum(m.visits.toLocaleString("fa-IR"))}</div>
                <div style={{ width: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", height: 140 }}>
                  <div style={{ height: `${(m.visits / maxVisits) * 100}%`, backgroundColor: "var(--admin-accent)", borderRadius: "3px 3px 0 0", minHeight: 4 }} />
                </div>
                <div style={{ fontSize: 11, color: "var(--admin-ink-soft)" }}>{m.month}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Law type distribution */}
        <Card title="توزیع انواع قوانین" desc="ترکیب قوانین بر اساس نوع">
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "0.5rem 0" }}>
            {lawTypeDistribution.map((t) => (
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
        </Card>
      </div>

      <div className="admin-grid-2" style={{ marginTop: "1rem" }}>
        {/* Recent activity */}
        <Card title="فعالیت‌های اخیر" desc="آخرین تغییرات انجام‌شده توسط مدیران">
          <div className="admin-stack-sm">
            {defaultActivity.slice(0, 6).map((a) => (
              <div key={a.id} style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start", padding: "0.5rem 0", borderBottom: "1px solid var(--admin-border-soft)" }}>
                <Badge variant={a.type === "law" ? "accent" : a.type === "user" ? "info" : a.type === "content" ? "success" : a.type === "settings" ? "warning" : "neutral"}>
                  {a.type === "law" ? "قانون" : a.type === "user" ? "کاربر" : a.type === "content" ? "محتوا" : a.type === "settings" ? "تنظیمات" : "احراز"}
                </Badge>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: "var(--admin-ink)" }}>
                    <strong style={{ fontWeight: 600 }}>{a.actor}</strong> {a.action}{" "}
                    <span style={{ color: "var(--admin-accent)" }}>{a.target}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--admin-ink-muted)", marginTop: 2 }}>{a.at}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "0.75rem" }}>
            <Link href="/admin/activity" className="admin-btn admin-btn-sm admin-btn-ghost">مشاهده همه ←</Link>
          </div>
        </Card>

        {/* Notifications */}
        <Card title="اعلان‌ها" desc="آخرین اعلان‌های سیستم">
          <div className="admin-stack-sm">
            {defaultNotifications.map((n) => (
              <div key={n.id} style={{ display: "flex", gap: "0.6rem", padding: "0.6rem", borderRadius: 4, backgroundColor: n.read ? "transparent" : "var(--admin-surface-raised)", border: "1px solid var(--admin-border-soft)" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: n.type === "success" ? "var(--admin-success)" : n.type === "warning" ? "var(--admin-warning)" : n.type === "danger" ? "var(--admin-danger)" : "var(--admin-info)", marginTop: 6, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: n.read ? 400 : 600, color: "var(--admin-ink)" }}>{n.title}</div>
                  <div style={{ fontSize: 11.5, color: "var(--admin-ink-soft)", marginTop: 2, lineHeight: 1.5 }}>{n.desc}</div>
                  <div style={{ fontSize: 10.5, color: "var(--admin-ink-muted)", marginTop: 4 }}>{n.at}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Top searched */}
      <Card title="پربازدیدترین قوانین" desc="پر جستجوترین قوانین در ۳۰ روز گذشته" style={{ marginTop: "1rem" }}>
        <table className="admin-table">
          <thead>
            <tr><th>رتبه</th><th>عنوان قانون</th><th className="col-num">تعداد جستجو</th><th className="col-narrow">عمل</th></tr>
          </thead>
          <tbody>
            {topSearchedLaws.map((l, i) => (
              <tr key={l.title}>
                <td style={{ color: "var(--admin-ink-muted)" }}>{faNum(i + 1)}</td>
                <td>{l.title}</td>
                <td className="col-num">{faNum(l.searches.toLocaleString("fa-IR"))}</td>
                <td className="col-narrow"><Link href="/admin/laws" className="admin-btn admin-btn-sm admin-btn-ghost">مشاهده</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
