"use client";

import { useState, useMemo } from "react";
import { PageHead, Card, Badge, Toolbar, SearchInput, Pagination, EmptyState, statusBadgeVariant, faNum } from "@/components/admin/primitives";
import { useToast } from "@/hooks/use-toast";
import { defaultAdminBookmarks, lawStatusVocab } from "@/lib/admin-data";

export default function BookmarksPage() {
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const filtered = useMemo(() => defaultAdminBookmarks.filter((b) => !q || `${b.user} ${b.lawTitle} ${b.lawId}`.toLowerCase().includes(q.toLowerCase())), [q]);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      <PageHead title="نشانه‌گذاری‌ها" subtitle={`${faNum(defaultAdminBookmarks.length)} نشانه در پایگاه`} />
      <Toolbar><SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="کاربر یا عنوان قانون…" /></Toolbar>
      <Card tight>
        {paged.length === 0 ? <EmptyState title="نشانه‌ای یافت نشد" /> : (
          <table className="admin-table">
            <thead><tr><th>کاربر</th><th>قانون</th><th>تاریخ</th><th>یادداشت</th><th className="col-narrow">عمل</th></tr></thead>
            <tbody>
              {paged.map((b) => (
                <tr key={b.id}>
                  <td><code className="admin-mono">@{b.user}</code></td>
                  <td><strong>{b.lawTitle}</strong><div className="admin-muted admin-mono">{b.lawId}</div></td>
                  <td><span className="admin-muted">{b.addedAt}</span></td>
                  <td><span className="admin-muted">{b.note || "—"}</span></td>
                  <td className="col-narrow"><button className="admin-btn admin-btn-sm admin-btn-ghost" onClick={() => toast({ title: "حذف", description: "آیتم حذف شد.", variant: "destructive" })}>حذف</button></td>
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
