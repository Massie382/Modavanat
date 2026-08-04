"use client";

import { useState, useMemo } from "react";
import { PageHead, Card, Badge, Toolbar, SearchInput, Pagination, EmptyState, Field, faNum } from "@/components/admin/primitives";
import { defaultAdminTickets } from "@/lib/admin-data";

const statusLabel: Record<string, string> = { open: "باز", pending: "در حال بررسی", closed: "بسته" };
const prioLabel: Record<string, string> = { low: "کم", medium: "متوسط", high: "زیاد" };

export default function TicketsPage() {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => defaultAdminTickets.filter((t) => {
    if (q && !`${t.id} ${t.subject} ${t.user}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    return true;
  }), [q, statusFilter]);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      <PageHead title="تیکت‌های پشتیبانی" subtitle={`${faNum(defaultAdminTickets.filter((t) => t.status !== "closed").length)} تیکت نیاز به پاسخ دارند`} />
      <Toolbar>
        <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="شناسه، موضوع یا کاربر…" />
        <select className="admin-select" style={{ width: "auto" }} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="all">همه</option>
          <option value="open">باز</option>
          <option value="pending">در حال بررسی</option>
          <option value="closed">بسته</option>
        </select>
      </Toolbar>

      <Card tight>
        {paged.length === 0 ? <EmptyState title="تیکتی یافت نشد" /> : (
          <table className="admin-table">
            <thead><tr><th>شناسه</th><th>موضوع</th><th>کاربر</th><th>دسته</th><th>اولویت</th><th>وضعیت</th><th>به‌روزرسانی</th><th className="col-narrow">عمل</th></tr></thead>
            <tbody>
              {paged.map((t) => (
                <tr key={t.id}>
                  <td><code className="admin-mono">{t.id}</code></td>
                  <td><strong>{t.subject}</strong></td>
                  <td><code className="admin-mono">@{t.user}</code></td>
                  <td><span className="admin-muted">{t.category}</span></td>
                  <td><Badge variant={t.priority === "high" ? "danger" : t.priority === "medium" ? "warning" : "neutral"}>{prioLabel[t.priority]}</Badge></td>
                  <td><Badge variant={t.status === "open" ? "success" : t.status === "pending" ? "warning" : "neutral"}>{statusLabel[t.status]}</Badge></td>
                  <td><span className="admin-muted">{t.updatedAt}</span></td>
                  <td className="col-narrow"><button className="admin-btn admin-btn-sm admin-btn-ghost">مشاهده</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination page={page} pageSize={pageSize} total={filtered.length} onChange={setPage} />
      </Card>
    </>
  );
}
