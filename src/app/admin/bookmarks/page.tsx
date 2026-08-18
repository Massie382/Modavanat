"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHead, Card, Toolbar, SearchInput, Pagination, EmptyState, faNum } from "@/components/admin/primitives";
import { useToast } from "@/hooks/use-toast";

interface BookmarkRow {
  id: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  lawId: string;
  lawTitle: string;
  note: string | null;
  createdAt: string;
}

function faDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fa-IR");
  } catch {
    return iso;
  }
}

export default function BookmarksPage() {
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const [rows, setRows] = useState<BookmarkRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      const res = await fetch(`/api/admin/bookmarks?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRows(data.rows ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در بارگذاری");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [q, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <>
      <PageHead title="نشانه‌گذاری‌ها" subtitle={loading ? "در حال بارگذاری…" : `${faNum(total)} نشانه در پایگاه`} />
      <Toolbar>
        <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="کاربر یا عنوان قانون…" />
      </Toolbar>
      <Card tight>
        {error && (
          <div className="admin-notice admin-notice-warning">بارگذاری ناموفق بود: {error}</div>
        )}
        {loading ? (
          <EmptyState title="در حال بارگذاری…" />
        ) : rows.length === 0 ? (
          <EmptyState title="نشانه‌ای یافت نشد" />
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>کاربر</th><th>قانون</th><th>تاریخ</th><th>یادداشت</th><th className="col-narrow">عمل</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id}>
                  <td>
                    <div><code className="admin-mono" dir="ltr">{b.userEmail}</code></div>
                    {b.userName && <div className="admin-muted">{b.userName}</div>}
                  </td>
                  <td>
                    <strong>{b.lawTitle}</strong>
                    <div className="admin-muted admin-mono" style={{ fontSize: 10 }}>{b.lawId}</div>
                  </td>
                  <td><span className="admin-muted">{faDate(b.createdAt)}</span></td>
                  <td><span className="admin-muted">{b.note || "—"}</span></td>
                  <td className="col-narrow">
                    <button
                      className="admin-btn admin-btn-sm admin-btn-ghost"
                      onClick={() => toast({ title: "اطلاع", description: "حذف نشانه‌گذاری در فاز ۷ پیاده‌سازی خواهد شد." })}
                    >حذف</button>
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
