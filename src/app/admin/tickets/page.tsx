"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { PageHead, Card, Badge, Toolbar, SearchInput, Pagination, EmptyState, faNum } from "@/components/admin/primitives";

const statusLabel: Record<string, string> = { open: "باز", pending: "در حال بررسی", closed: "بسته" };
const prioLabel: Record<string, string> = { low: "کم", medium: "متوسط", high: "زیاد" };

interface TicketRow {
  id: string;
  subject: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  category: string;
  status: string;
  priority: string;
  lawId: string | null;
  lastReplyAt: string | null;
  lastReplyFrom: string | null;
  createdAt: string;
  updatedAt: string;
}

function faDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fa-IR");
  } catch {
    return iso;
  }
}

export default function TicketsPage() {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [rows, setRows] = useState<TicketRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      const res = await fetch(`/api/admin/tickets?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRows(data.rows ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در بارگذاری تیکت‌ها");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [q, statusFilter, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCount = useMemo(
    () => rows.filter((t) => t.status !== "closed").length,
    [rows]
  );

  return (
    <>
      <PageHead
        title="تیکت‌های پشتیبانی"
        subtitle={loading ? "در حال بارگذاری…" : `${faNum(total)} تیکت در پایگاه · ${faNum(openCount)} تیکت نیاز به پاسخ دارند`}
      />
      <Toolbar>
        <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="شناسه، موضوع یا کاربر…" />
        <select
          className="admin-select"
          style={{ width: "auto" }}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="all">همه</option>
          <option value="open">باز</option>
          <option value="pending">در حال بررسی</option>
          <option value="closed">بسته</option>
        </select>
      </Toolbar>

      <Card tight>
        {error && (
          <div className="admin-notice admin-notice-warning">بارگذاری ناموفق بود: {error}</div>
        )}
        {loading ? (
          <EmptyState title="در حال بارگذاری…" />
        ) : rows.length === 0 ? (
          <EmptyState title="تیکتی یافت نشد" />
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>شناسه</th><th>موضوع</th><th>کاربر</th><th>دسته</th>
                <th>اولویت</th><th>وضعیت</th><th>به‌روزرسانی</th><th className="col-narrow">عمل</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id}>
                  <td><code className="admin-mono" style={{ fontSize: 10 }}>{t.id.slice(0, 8)}</code></td>
                  <td><strong>{t.subject}</strong></td>
                  <td>
                    <div>{t.userEmail}</div>
                    {t.userName && <div className="admin-muted admin-mono" style={{ fontSize: 10 }}>{t.userName}</div>}
                  </td>
                  <td><span className="admin-muted">{t.category}</span></td>
                  <td><Badge variant={t.priority === "high" ? "danger" : t.priority === "medium" ? "warning" : "neutral"}>{prioLabel[t.priority] ?? t.priority}</Badge></td>
                  <td><Badge variant={t.status === "open" ? "success" : t.status === "pending" ? "warning" : "neutral"}>{statusLabel[t.status] ?? t.status}</Badge></td>
                  <td><span className="admin-muted">{faDate(t.updatedAt)}</span></td>
                  <td className="col-narrow">
                    <a
                      className="admin-btn admin-btn-sm admin-btn-ghost"
                      href={`/api/admin/tickets/${encodeURIComponent(t.id)}`}
                      target="_blank"
                      rel="noreferrer"
                    >مشاهده</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />
      </Card>
    </>
  );
}
