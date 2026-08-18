"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHead, Card, Badge, Toolbar, SearchInput, Pagination, EmptyState, faNum } from "@/components/admin/primitives";

interface AuditEntry {
  id: string;
  actorUserId: string | null;
  actorEmail: string | null;
  actorName: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: unknown;
  ip: string | null;
  createdAt: string;
}

function faDateTime(iso: string): string {
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

function actionToType(action: string): "law" | "user" | "content" | "settings" | "auth" {
  const a = action.toLowerCase();
  if (a.includes("login") || a.includes("signup") || a.includes("password") || a.includes("auth")) return "auth";
  if (a.startsWith("admin.user") || a.startsWith("user.")) return "user";
  if (a.includes("law")) return "law";
  if (a.includes("settings")) return "settings";
  if (a.includes("ticket") || a.includes("purchase") || a.includes("bookmark")) return "content";
  return "user";
}

export default function ActivityPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const [rows, setRows] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      const res = await fetch(`/api/admin/audit?${params.toString()}`, { cache: "no-store" });
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
  }, [search, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <>
      <PageHead title="لاگ فعالیت" subtitle={loading ? "در حال بارگذاری…" : `${faNum(total)} رویداد در پایگاه`} />
      <Toolbar>
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="جستجو در لاگ (action، ایمیل، شناسه هدف)…" />
      </Toolbar>
      <Card tight>
        {error && (
          <div className="admin-notice admin-notice-warning">بارگذاری ناموفق بود: {error}</div>
        )}
        {loading ? (
          <EmptyState title="در حال بارگذاری…" />
        ) : rows.length === 0 ? (
          <EmptyState title="رویدادی ثبت نشده" />
        ) : (
          <table className="admin-table">
            <thead>
              <tr><th>زمان</th><th>مدیر</th><th>عمل</th><th>هدف</th><th>نوع</th></tr>
            </thead>
            <tbody>
              {rows.map((a) => {
                const type = actionToType(a.action);
                return (
                  <tr key={a.id}>
                    <td><span className="admin-muted">{faDateTime(a.createdAt)}</span></td>
                    <td>
                      {a.actorEmail ? (
                        <code className="admin-mono" dir="ltr">{a.actorEmail}</code>
                      ) : <span className="admin-muted">سیستم</span>}
                    </td>
                    <td>
                      <code className="admin-mono" dir="ltr" style={{ fontSize: 11 }}>{a.action}</code>
                    </td>
                    <td>
                      <strong style={{ color: "var(--admin-accent)" }} dir="ltr">
                        {a.targetType ? `${a.targetType}:` : ""} {a.targetId ?? "—"}
                      </strong>
                    </td>
                    <td>
                      <Badge variant={
                        type === "law" ? "accent" :
                        type === "user" ? "info" :
                        type === "content" ? "success" :
                        type === "settings" ? "warning" : "neutral"
                      }>
                        {type === "law" ? "قانون" : type === "user" ? "کاربر" : type === "content" ? "محتوا" : type === "settings" ? "تنظیمات" : "احراز"}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />
      </Card>
    </>
  );
}
