"use client";

import { PageHead, Card, Badge, Toolbar, SearchInput, EmptyState, faNum } from "@/components/admin/primitives";
import { defaultActivity } from "@/lib/admin-data";

export default function ActivityPage() {
  return (
    <>
      <PageHead title="لاگ فعالیت" subtitle={`${faNum(defaultActivity.length)} رویداد اخیر`} />
      <Toolbar><SearchInput value="" onChange={() => {}} placeholder="جستجو در لاگ…" /></Toolbar>
      <Card tight>
        <table className="admin-table">
          <thead><tr><th>زمان</th><th>مدیر</th><th>عمل</th><th>هدف</th><th>نوع</th></tr></thead>
          <tbody>
            {defaultActivity.map((a) => (
              <tr key={a.id}>
                <td><span className="admin-muted">{a.at}</span></td>
                <td><code className="admin-mono">@{a.actor}</code></td>
                <td>{a.action}</td>
                <td><strong style={{ color: "var(--admin-accent)" }}>{a.target}</strong></td>
                <td><Badge variant={a.type === "law" ? "accent" : a.type === "user" ? "info" : a.type === "content" ? "success" : a.type === "settings" ? "warning" : "neutral"}>{a.type === "law" ? "قانون" : a.type === "user" ? "کاربر" : a.type === "content" ? "محتوا" : a.type === "settings" ? "تنظیمات" : "احراز"}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
