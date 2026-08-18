"use client";

import { useState, useEffect } from "react";
import { PageHead, Card, Badge, EmptyState, faNum } from "@/components/admin/primitives";
import { useToast } from "@/hooks/use-toast";

interface ContactTicketRow {
  id: string;
  subject: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
}

const statusLabel: Record<string, string> = {
  open: "باز",
  pending: "در حال بررسی",
  closed: "بسته",
};

function faDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fa-IR");
  } catch {
    return iso;
  }
}

export default function ContactEmailsPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<ContactTicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/contact-emails", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setRows(data.rows ?? []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "خطا در بارگذاری");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <PageHead
        title="ایمیل‌های تماس"
        subtitle="فرم‌های تماس ناشناس ارسال‌شده توسط بازدیدکنندگان"
        actions={
          <button
            className="admin-btn admin-btn-primary"
            onClick={() => toast({ title: "اطلاع", description: "ایجاد ایمیل تماس در فاز ۷ پیاده‌سازی خواهد شد." })}
          >+ ایمیل جدید</button>
        }
      />

      <Card title="فهرست پیام‌های تماس">
        {error && (
          <div className="admin-notice admin-notice-warning">بارگذاری ناموفق بود: {error}</div>
        )}
        {loading ? (
          <EmptyState title="در حال بارگذاری…" />
        ) : rows.length === 0 ? (
          <EmptyState title="پیام تماسی ثبت نشده" desc="فرم‌های تماس ناشناس از طریق صفحه /contact در اینجا نمایش داده می‌شوند." />
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>موضوع</th><th>دسته</th><th>وضعیت</th><th>تاریخ</th>
                <th className="col-narrow">عمل</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id}>
                  <td><strong>{t.subject}</strong><div className="admin-muted admin-mono" style={{ fontSize: 10 }}>{t.id}</div></td>
                  <td><span className="admin-muted">{t.category}</span></td>
                  <td><Badge variant={t.status === "open" ? "success" : t.status === "pending" ? "warning" : "neutral"}>{statusLabel[t.status] ?? t.status}</Badge></td>
                  <td><span className="admin-muted">{faDate(t.createdAt)}</span></td>
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
      </Card>

      <div className="admin-notice admin-notice-info" style={{ marginTop: "1rem" }}>
        برای پاسخ به این پیام‌ها، از تیکت اصلی در بخش تیکت‌ها اقدام کنید — ایمیل پاسخگو در متن اولین پیام تیکت درج شده است.
      </div>
    </>
  );
}
