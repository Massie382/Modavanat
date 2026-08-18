"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Field, PasswordInput } from "@/components/auth/AuthFields";
import {
  normalizePhone,
  toAsciiDigits,
  maskIdentifier,
} from "@/lib/auth/identifier";

type IdentifierKind = "email" | "phone";
type Step = "request" | "verify" | "reset" | "done";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("request");
  const [identifierKind, setIdentifierKind] = useState<IdentifierKind>("email");
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [submitting, setSubmitting] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const resendTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Track initial mount so we don't yank focus to the heading on first paint
  // (the request step's identifier input has `autoFocus` for that).
  const isFirstRender = useRef(true);

  // Move focus to the new step's heading whenever the step changes, so
  // screen-reader users hear the context change. The AuthLayout renders a
  // single <h1> per render; we make it focusable and move focus to it.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const heading = document.querySelector("h1");
    if (heading instanceof HTMLElement) {
      heading.tabIndex = -1;
      heading.focus();
      if (typeof window !== "undefined" && window.scrollY > 0) {
        window.scrollTo({ top: 0, behavior: "auto" });
      }
    }
  }, [step]);

  // Resend cooldown timer — counts down from 60s after a code is "sent".
  useEffect(() => {
    if (resendIn <= 0) {
      if (resendTimer.current) {
        clearInterval(resendTimer.current);
        resendTimer.current = null;
      }
      return;
    }
    if (!resendTimer.current) {
      resendTimer.current = setInterval(() => {
        setResendIn((s) => Math.max(0, s - 1));
      }, 1000);
    }
    return () => {
      if (resendIn <= 0 && resendTimer.current) {
        clearInterval(resendTimer.current);
        resendTimer.current = null;
      }
    };
  }, [resendIn]);

  const startResendCooldown = () => setResendIn(60);

  const identifierLabel = identifierKind === "email" ? "ایمیل" : "شماره موبایل";
  const placeholder =
    identifierKind === "email"
      ? "example@modavanat.ir"
      : "۰۹۱۲۳۴۵۶۷۸۹";

  /* ─── Step 1: Request — validate identifier ─── */
  const validateRequest = () => {
    const next: typeof errors = {};
    const v = identifier.trim();
    if (!v) {
      next.identifier = `${identifierLabel} را وارد کنید.`;
    } else if (identifierKind === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
        next.identifier = "قالب ایمیل معتبر نیست.";
      }
    } else {
      const normalized = toAsciiDigits(v);
      if (!normalizePhone(normalized)) {
        next.identifier = "شماره موبایل نامعتبر است. باید با ۰۹ شروع شود و ۱۱ رقم باشد.";
      }
    }
    return next;
  };

  const handleRequestSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const next = validateRequest();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    // Send the right payload shape: the server branches on `kind`.
    // (Pre-Phase-8 clients sent `{ email }` only — still works thanks
    // to the .or() fallback in the Zod schema.)
    const payload =
      identifierKind === "email"
        ? { kind: "email" as const, email: identifier.trim().toLowerCase() }
        : { kind: "phone" as const, phone: identifier.trim() };
    try {
      const r = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok || r.status === 200) {
        setStep("verify");
        startResendCooldown();
      } else if (r.status === 429) {
        setErrors({ identifier: j.error ?? "تلاش‌های بیش از حد. لطفاً بعداً تلاش کنید." });
      } else if (r.status === 502) {
        setErrors({ identifier: j.error ?? "ارسال پیامک ناموفق بود. لطفاً دوباره تلاش کنید." });
      } else {
        setErrors({ identifier: j.error ?? "خطایی رخ داد. لطفاً دوباره تلاش کنید." });
      }
    } catch {
      setErrors({ identifier: "ارتباط با سرور ناموفق بود." });
    }
    setSubmitting(false);
  };

  /* ─── Step 2: Verify — validate OTP code ─── */
  const validateVerify = () => {
    const next: typeof errors = {};
    const normalized = toAsciiDigits(code).replace(/\D/g, "");
    if (!normalized) {
      next.code = "کد تأیید را وارد کنید.";
    } else if (normalized.length !== 6) {
      next.code = "کد تأیید باید ۶ رقم باشد.";
    }
    return next;
  };

  const handleVerifySubmit = async (e: FormEvent) => {
    e.preventDefault();
    const next = validateVerify();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    // The OTP is verified as part of the final reset-password call, so
    // there's no separate "verify" endpoint — the user just types the
    // OTP and the new password together in step 3. We move them along
    // to the reset step.
    setSubmitting(false);
    setStep("reset");
  };

  const handleResend = async () => {
    if (resendIn > 0 || submitting) return;
    setErrors({});
    setSubmitting(true);
    const payload =
      identifierKind === "email"
        ? { kind: "email" as const, email: identifier.trim().toLowerCase() }
        : { kind: "phone" as const, phone: identifier.trim() };
    try {
      const r = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        startResendCooldown();
        setCode("");
      } else if (r.status === 429) {
        setErrors({ identifier: j.error ?? "تلاش‌های بیش از حد. لطفاً بعداً تلاش کنید." });
      } else if (r.status === 502) {
        setErrors({ identifier: j.error ?? "ارسال پیامک ناموفق بود." });
      } else {
        setErrors({ identifier: j.error ?? "خطایی رخ داد. لطفاً دوباره تلاش کنید." });
      }
    } catch {
      setErrors({ identifier: "ارتباط با سرور ناموفق بود." });
    }
    setSubmitting(false);
  };

  /* ─── Step 3: Reset — validate new password ─── */
  const validateReset = () => {
    const next: typeof errors = {};
    if (!password) {
      next.password = "رمز عبور جدید را وارد کنید.";
    } else if (password.length < 8) {
      next.password = "رمز عبور باید حداقل ۸ نویسه باشد.";
    }
    if (!confirm) {
      next.confirm = "تکرار رمز عبور را وارد کنید.";
    } else if (confirm !== password) {
      next.confirm = "تکرار رمز عبور با رمز عبور مطابقت ندارد.";
    }
    return next;
  };

  const handleResetSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const next = validateReset();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    // Send the right payload shape. The server branches on `kind` to
    // look up the user by email OR phone, then verifies the OTP and
    // sets the new password.
    const payload =
      identifierKind === "email"
        ? {
            kind: "email" as const,
            email: identifier.trim().toLowerCase(),
            otp: toAsciiDigits(code).replace(/\D/g, ""),
            password,
          }
        : {
            kind: "phone" as const,
            phone: identifier.trim(),
            otp: toAsciiDigits(code).replace(/\D/g, ""),
            password,
          };
    try {
      const r = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        setStep("done");
      } else if (r.status === 410) {
        setErrors({ form: j.error ?? "کد نامعتبر یا منقضی است." });
        // Bounce back to step 1 so they can request a new OTP.
        setStep("request");
        setCode("");
        setResendIn(0);
      } else if (r.status === 429) {
        setErrors({ form: j.error ?? "تلاش‌های بیش از حد. لطفاً بعداً تلاش کنید." });
      } else {
        setErrors({ form: j.error ?? "خطایی رخ داد. لطفاً دوباره تلاش کنید." });
      }
    } catch {
      setErrors({ form: "ارتباط با سرور ناموفق بود." });
    }
    setSubmitting(false);
  };

  /* ─── Render ─── */
  if (step === "done") {
    return (
      <AuthLayout
        eyebrow="بازیابی رمز عبور"
        title="رمز عبور تغییر کرد"
        subtitle="اکنون می‌توانید با رمز عبور جدید وارد حساب خود شوید."
        footer={
          <div className="auth-switch">
            حساب کاربری ندارید؟
            <Link href="/signup">ثبت‌نام کنید</Link>
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
            رمز عبور شما با موفقیت بازنشانی شد. برای ادامه وارد حساب خود شوید.
          </p>
          <Link href="/signin" className="auth-submit mt-5" style={{ textDecoration: "none" }}>
            ورود به حساب
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (step === "verify") {
    return (
      <AuthLayout
        eyebrow="بازیابی رمز عبور"
        title="کد تأیید را وارد کنید"
        subtitle={`یک کد ۶ رقمی به ${maskIdentifier(identifierKind, identifier)} ارسال شد.`}
        footer={
          <div className="auth-switch">
            شماره/ایمیل اشتباه بود؟
            <button
              type="button"
              onClick={() => {
                setStep("request");
                setCode("");
                setErrors({});
                setResendIn(0);
              }}
              className="link-legal bg-transparent p-0 border-0 cursor-pointer font-inherit"
            >
              تغییر شناسه
            </button>
          </div>
        }
      >
        <form onSubmit={handleVerifySubmit} noValidate className="space-y-5">
          <Field
            label="کد تأیید"
            htmlFor="code"
            error={errors.code}
            hint={errors.code ? undefined : "کد ۶ رقمی ارسال‌شده را وارد کنید."}
          >
            <input
              id="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => {
                const normalized = toAsciiDigits(e.target.value).replace(/\D/g, "").slice(0, 6);
                setCode(normalized);
              }}
              placeholder="••••••"
              dir="ltr"
              className={`auth-input auth-code-input ${errors.code ? "is-error" : ""}`}
              style={{ textAlign: "center", letterSpacing: "0.5em" }}
              autoFocus
            />
          </Field>

          <p className="text-[12px] text-[#9c9c9c] -mt-1">
            کد را از {identifierKind === "email" ? "ایمیل" : "پیامک"} خود وارد کنید. این کد تنها ۱۵ دقیقه معتبر است.
          </p>

          <button
            type="submit"
            className="auth-submit"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                در حال بررسی…
              </>
            ) : (
              "تأیید کد"
            )}
          </button>

          <div className="text-center text-[12.5px] text-[#6b6b6b]">
            {resendIn > 0 ? (
              <>ارسال مجدد کد تا {resendIn} ثانیه دیگر</>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={submitting}
                className="link-legal bg-transparent p-0 border-0 cursor-pointer font-inherit disabled:opacity-50"
              >
                ارسال مجدد کد
              </button>
            )}
          </div>
        </form>
      </AuthLayout>
    );
  }

  if (step === "reset") {
    return (
      <AuthLayout
        eyebrow="بازیابی رمز عبور"
        title="رمز عبور جدید"
        subtitle="رمز عبور جدید خود را وارد کنید و تکرار آن را تأیید نمایید."
        footer={
          <div className="auth-switch">
            حساب دارید؟
            <Link href="/signin">ورود به حساب</Link>
          </div>
        }
      >
        <form onSubmit={handleResetSubmit} noValidate className="space-y-5">
          {errors.form && (
            <div role="alert" style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              padding: "0.75rem 1rem",
              borderRadius: 6,
              fontSize: 13,
            }}>
              {errors.form}
            </div>
          )}
          <Field
            label="رمز عبور جدید"
            htmlFor="password"
            error={errors.password}
            hint={errors.password ? undefined : "حداقل ۸ نویسه؛ ترجیحاً ترکیب حروف، عدد و نماد."}
          >
            <PasswordInput
              id="password"
              value={password}
              onChange={setPassword}
              placeholder="حداقل ۸ نویسه"
              autoComplete="new-password"
              hasError={!!errors.password}
              showStrength
              ariaLabel="رمز عبور جدید"
            />
          </Field>

          <Field
            label="تکرار رمز عبور"
            htmlFor="confirm"
            error={errors.confirm}
          >
            <PasswordInput
              id="confirm"
              value={confirm}
              onChange={setConfirm}
              placeholder="رمز عبور را دوباره وارد کنید"
              autoComplete="new-password"
              hasError={!!errors.confirm}
              ariaLabel="تکرار رمز عبور"
            />
          </Field>

          <button
            type="submit"
            className="auth-submit"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                در حال بازنشانی…
              </>
            ) : (
              "بازنشانی رمز عبور"
            )}
          </button>
        </form>
      </AuthLayout>
    );
  }

  /* ─── Step: request (default) ─── */
  return (
    <AuthLayout
      eyebrow="بازیابی رمز عبور"
      title="رمز عبور را فراموش کرده‌اید؟"
      subtitle="ایمیل یا شماره تلفن خود را وارد کنید تا کد بازنشانی برای شما ارسال شود."
      footer={
        <div className="auth-switch">
          حساب دارید؟
          <Link href="/signin">ورود به حساب</Link>
        </div>
      }
    >
      <form onSubmit={handleRequestSubmit} noValidate className="space-y-5">
        {/* Identifier selector */}
        <div>
          <span className="auth-label">ایمیل یا شماره تلفن</span>
          <div className="auth-segmented" role="tablist" aria-label="نوع شناسه">
            <button
              type="button"
              role="tab"
              aria-selected={identifierKind === "email"}
              onClick={() => {
                setIdentifierKind("email");
                setIdentifier("");
                setErrors({});
              }}
              className={`auth-segment ${identifierKind === "email" ? "is-active" : ""}`}
            >
              ایمیل
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={identifierKind === "phone"}
              onClick={() => {
                setIdentifierKind("phone");
                setIdentifier("");
                setErrors({});
              }}
              className={`auth-segment ${identifierKind === "phone" ? "is-active" : ""}`}
            >
              شماره تلفن
            </button>
          </div>
        </div>

        {/* Identifier */}
        <Field
          label={identifierLabel}
          htmlFor="identifier"
          error={errors.identifier}
          hasError={!!errors.identifier}
        >
          <input
            id="identifier"
            type={identifierKind === "email" ? "email" : "tel"}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder={placeholder}
            autoComplete={identifierKind === "email" ? "email" : "tel"}
            inputMode={identifierKind === "phone" ? "tel" : "email"}
            spellCheck={false}
            dir="ltr"
            className={`auth-input ${errors.identifier ? "is-error" : ""}`}
            style={{ textAlign: "right" }}
            autoFocus
          />
        </Field>

        {/* Submit */}
        <button
          type="submit"
          className="auth-submit"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              در حال ارسال کد…
            </>
          ) : (
            "ارسال کد بازنشانی"
          )}
        </button>

        {/* Divider + back to signin */}
        <div className="auth-divider">یا</div>

        <Link
          href="/signin"
          className="auth-submit"
          style={{
            backgroundColor: "transparent",
            color: "var(--ink)",
            borderColor: "var(--rule)",
          }}
        >
          بازگشت به ورود
        </Link>
      </form>
    </AuthLayout>
  );
}
