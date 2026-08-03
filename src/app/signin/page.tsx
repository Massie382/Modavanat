"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Field, PasswordInput, AgreementCheckbox } from "@/components/auth/AuthFields";

type IdentifierKind = "email" | "phone";

export default function SignInPage() {
  const [identifierKind, setIdentifierKind] = useState<IdentifierKind>("email");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{
    identifier?: string | null;
    password?: string | null;
    form?: string | null;
  }>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const placeholder =
    identifierKind === "email"
      ? "نام کاربری یا ایمیل خود را وارد کنید"
      : "نام کاربری یا شماره تلفن خود را وارد کنید";

  const validate = () => {
    const next: typeof errors = {};
    const v = identifier.trim();
    if (!v) {
      next.identifier = "لطفاً نام کاربری، ایمیل یا شماره تلفن خود را وارد کنید.";
    } else if (identifierKind === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && !/^0?9\d{9}$/.test(v) && !/^[\u0600-\u06FF\w.-]{3,}$/.test(v)) {
      next.identifier = "قالب ایمیل یا شماره تلفن معتبر نیست.";
    } else if (identifierKind === "phone" && !/^0?9\d{9}$/.test(v) && !/^[\u0600-\u06FF\w.-]{3,}$/.test(v)) {
      next.identifier = "شماره تلفن باید با ۰۹ شروع شود و ۱۱ رقم باشد.";
    }
    if (!password) {
      next.password = "رمز عبور را وارد کنید.";
    } else if (password.length < 6) {
      next.password = "رمز عبور باید حداقل ۶ نویسه باشد.";
    }
    return next;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    // Simulated submit — wire to the real auth API when ready.
    await new Promise((r) => setTimeout(r, 700));
    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <AuthLayout
        eyebrow="ورود به حساب"
        title="خوش آمدید"
        subtitle="در حال انتقال به حساب کاربری شما…"
        footer={
          <div className="auth-switch">
            مشکلی پیش آمد؟
            <Link href="/signin">تلاش دوباره</Link>
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
            ورود موفقیت‌آمیز بود. اگر به‌صورت خودکار منتقل نشدید،
            <Link href="/" className="link-legal mr-1">اینجا را کلیک کنید</Link>.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow="ورود به حساب"
      title="خوش آمدید"
      subtitle="برای دسترسی به امکانات شخصی مدونات وارد شوید."
      footer={
        <div className="auth-switch">
          حساب کاربری ندارید؟
          <Link href="/signup">ثبت‌نام کنید</Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Identifier selector */}
        <div>
          <div className="auth-segmented" role="tablist" aria-label="نوع شناسه">
            <button
              type="button"
              role="tab"
              aria-selected={identifierKind === "email"}
              onClick={() => setIdentifierKind("email")}
              className={`auth-segment ${identifierKind === "email" ? "is-active" : ""}`}
            >
              ایمیل
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={identifierKind === "phone"}
              onClick={() => setIdentifierKind("phone")}
              className={`auth-segment ${identifierKind === "phone" ? "is-active" : ""}`}
            >
              شماره تلفن
            </button>
          </div>
        </div>

        {/* Identifier */}
        <Field
          label="ایمیل یا شماره تلفن"
          htmlFor="identifier"
          error={errors.identifier}
        >
          <input
            id="identifier"
            type={identifierKind === "email" ? "email" : "tel"}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder={placeholder}
            autoComplete={identifierKind === "email" ? "email" : "tel"}
            inputMode={identifierKind === "phone" ? "tel" : "email"}
            dir="ltr"
            className={`auth-input ${errors.identifier ? "is-error" : ""}`}
            style={{ textAlign: "right" }}
          />
        </Field>

        {/* Password */}
        <Field
          label="رمز عبور"
          htmlFor="password"
          error={errors.password}
        >
          <PasswordInput
            id="password"
            value={password}
            onChange={setPassword}
            placeholder="رمز عبور خود را وارد کنید"
            autoComplete="current-password"
            hasError={!!errors.password}
            ariaLabel="رمز عبور"
          />
        </Field>

        {/* Remember + forgot */}
        <div className="flex items-center justify-between gap-4">
          <AgreementCheckbox
            id="remember"
            checked={remember}
            onChange={setRemember}
          >
            مرا به خاطر بسپار
          </AgreementCheckbox>
          <Link
            href="/forgot-password"
            className="text-[12.5px] text-[#3d3d3d] hover:text-[#1a1a1a] underline underline-offset-2 decoration-[var(--rule)] hover:decoration-[var(--ink)] transition-colors shrink-0"
          >
            رمز عبور را فراموش کرده‌اید؟
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="auth-submit"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              در حال ورود…
            </>
          ) : (
            "ورود به حساب"
          )}
        </button>

        {/* Divider + alternate */}
        <div className="auth-divider">یا</div>

        <Link
          href="/signup"
          className="auth-submit"
          style={{
            backgroundColor: "transparent",
            color: "var(--ink)",
            borderColor: "var(--rule)",
          }}
        >
          ساخت حساب جدید
        </Link>
      </form>
    </AuthLayout>
  );
}
