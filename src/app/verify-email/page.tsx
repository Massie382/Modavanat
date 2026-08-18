"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";

function VerifyEmailContent() {
  const sp = useSearchParams();
  const error = sp.get("error");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error2, setError2] = useState<string | null>(null);

  // If we got here with ?error=invalid or ?error=missing, that means
  // the user clicked an expired/invalid verification link. Show a
  // friendly "request a new one" UI.
  if (error) {
    return (
      <AuthLayout
        eyebrow="فعال‌سازی حساب"
        title="پیوند نامعتبر"
        subtitle="این پیوند منقضی شده یا قبلاً استفاده شده است."
        footer={
          <div className="auth-switch">
            حساب دارید؟
            <Link href="/signin">ورود به حساب</Link>
          </div>
        }
      >
        <div className="text-center py-2">
          <p className="text-[14px] text-[#3d3d3d] leading-7 mb-4">
            برای دریافت پیوند فعال‌سازی جدید، ایمیل خود را وارد کنید.
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!email) return;
              setSending(true);
              setError2(null);
              try {
                const r = await fetch("/api/auth/verify-email", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ email }),
                });
                if (r.ok) {
                  setSent(true);
                } else {
                  const j = await r.json().catch(() => ({}));
                  setError2(j.error ?? "خطایی رخ داد.");
                }
              } catch {
                setError2("ارتباط با سرور ناموفق بود.");
              }
              setSending(false);
            }}
            className="space-y-3"
          >
            <input
              type="email"
              required
              placeholder="example@modavanat.ir"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              dir="ltr"
            />
            {sent ? (
              <p className="text-[13px] text-[var(--ink)]">
                اگر ایمیل در سیستم باشد، پیوند جدید ارسال شد.
              </p>
            ) : (
              <button type="submit" className="auth-submit" disabled={sending || !email}>
                {sending ? "در حال ارسال…" : "ارسال پیوند جدید"}
              </button>
            )}
            {error2 && <p className="auth-error" role="alert">{error2}</p>}
          </form>
        </div>
      </AuthLayout>
    );
  }

  // No error param — we're waiting for the user to click the link in
  // their email. This page is the landing URL for the email link too,
  // so most users never see this — the GET handler in
  // /api/auth/verify-email/route.ts redirects to /signin?verified=1.
  return (
    <AuthLayout
      eyebrow="فعال‌سازی حساب"
      title="حساب شما فعال شد"
      subtitle="اکنون می‌توانید وارد شوید."
      footer={
        <div className="auth-switch">
          <Link href="/signin" className="auth-submit" style={{ textDecoration: "none" }}>
            ادامه به ورود
          </Link>
        </div>
      }
    >
      <div className="text-center py-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#f4f3f0] mb-4">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="text-[14px] text-[#3d3d3d] leading-7">
          ایمیل شما تأیید شد. اکنون می‌توانید وارد شوید.
        </p>
      </div>
    </AuthLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
