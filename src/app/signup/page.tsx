"use client";

import { useState, FormEvent, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Field, PasswordInput, AgreementCheckbox } from "@/components/auth/AuthFields";
import {
  normalizePhone,
  toAsciiDigits,
  maskIdentifier,
} from "@/lib/auth/identifier";

type IdentifierKind = "email" | "phone";
type Step = "form" | "otp" | "done";

// Persian digit → ASCII digit map for normalizing user input.
const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export default function SignUpPage() {
  const [step, setStep] = useState<Step>("form");
  const [username, setUsername] = useState("");
  const [identifierKind, setIdentifierKind] = useState<IdentifierKind>("email");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agree, setAgree] = useState(false);
  const [otp, setOtp] = useState("");
  const [errors, setErrors] = useState<{
    username?: string | null;
    identifier?: string | null;
    password?: string | null;
    confirm?: string | null;
    agree?: string | null;
    otp?: string | null;
    form?: string | null;
  }>({});
  const [submitting, setSubmitting] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const resendTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Move focus to the success message heading when the simulated
  // "verification email sent" state is entered.
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (step === "done") {
      successHeadingRef.current?.focus();
    }
  }, [step]);

  // Resend cooldown timer.
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

  const startResendCooldown = useCallback(() => setResendIn(60), []);

  const identifierLabel =
    identifierKind === "email" ? "ایمیل" : "شماره موبایل";
  const placeholder =
    identifierKind === "email"
      ? "example@modavanat.ir"
      : "۰۹۱۲۳۴۵۶۷۸۹";

  const validateForm = () => {
    const next: typeof errors = {};
    const u = username.trim();
    if (!u) {
      next.username = "نام کاربری را وارد کنید.";
    } else if (u.length < 3) {
      next.username = "نام کاربری باید حداقل ۳ نویسه باشد.";
    } else if (!/^[\u0600-\u06FFa-zA-Z0-9_.-]+$/.test(u)) {
      next.username = "نام کاربری فقط می‌تواند شامل حروف، عدد، نقطه، خط تیره و زیرخط باشد.";
    }

    const id = identifier.trim();
    if (!id) {
      next.identifier = `${identifierLabel} را وارد کنید.`;
    } else if (identifierKind === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(id)) {
        next.identifier = "قالب ایمیل معتبر نیست.";
      }
    } else {
      // phone — normalize Persian digits then validate
      const normalized = id.replace(/[۰-۹]/g, (d) =>
        String(PERSIAN_DIGITS.indexOf(d))
      );
      if (!normalizePhone(normalized)) {
        next.identifier = "شماره موبایل نامعتبر است. باید با ۰۹ شروع شود و ۱۱ رقم باشد.";
      }
    }

    if (!password) {
      next.password = "رمز عبور را وارد کنید.";
    } else if (password.length < 8) {
      next.password = "رمز عبور باید حداقل ۸ نویسه باشد.";
    }

    if (!confirm) {
      next.confirm = "تکرار رمز عبور را وارد کنید.";
    } else if (confirm !== password) {
      next.confirm = "تکرار رمز عبور با رمز عبور مطابقت ندارد.";
    }

    if (!agree) {
      next.agree = "برای ادامه باید با حریم خصوصی و شرایط استفاده موافقت کنید.";
    }
    return next;
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const next = validateForm();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    // POST to /api/auth/signup. The server creates the user row
    // (scrypt-hashed password) and sends a verification email OR an
    // OTP SMS depending on `kind`.
    try {
      const payload =
        identifierKind === "email"
          ? {
              kind: "email" as const,
              name: username.trim(),
              email: identifier.trim().toLowerCase(),
              password,
            }
          : {
              kind: "phone" as const,
              name: username.trim(),
              phone: identifier.trim(),
              password,
            };
      const r = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        if (identifierKind === "phone") {
          // Phone signup: advance to the OTP step. The OTP has been
          // sent via SMS; the user types it in the next step.
          setStep("otp");
          startResendCooldown();
        } else {
          // Email signup: the verification magic link has been emailed.
          setStep("done");
        }
      } else if (r.status === 409) {
        setErrors({ identifier: j.error ?? "این ایمیل/شماره قبلاً ثبت شده است." });
      } else if (r.status === 429) {
        setErrors({ form: j.error ?? "تلاش‌های بیش از حد. لطفاً بعداً تلاش کنید." });
      } else if (r.status === 502) {
        setErrors({ form: j.error ?? "ارسال پیامک ناموفق بود. لطفاً دوباره تلاش کنید." });
      } else {
        setErrors({ form: j.error ?? "خطایی در زمان ثبت‌نام رخ داد." });
      }
    } catch {
      setErrors({ form: "ارتباط با سرور ناموفق بود. لطفاً دوباره تلاش کنید." });
    }
    setSubmitting(false);
  };

  const validateOtp = () => {
    const next: typeof errors = {};
    const norm = toAsciiDigits(otp).replace(/\D/g, "");
    if (!norm) next.otp = "کد تأیید را وارد کنید.";
    else if (norm.length !== 6) next.otp = "کد تأیید باید ۶ رقم باشد.";
    return next;
  };

  const handleOtpResend = async () => {
    if (resendIn > 0 || submitting) return;
    setErrors({});
    setSubmitting(true);
    try {
      const r = await fetch("/api/auth/verify-phone", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: identifier.trim() }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        startResendCooldown();
        setOtp("");
      } else if (r.status === 429) {
        setErrors({ form: j.error ?? "تلاش‌های بیش از حد. لطفاً بعداً تلاش کنید." });
      } else if (r.status === 502) {
        setErrors({ form: j.error ?? "ارسال پیامک ناموفق بود." });
      } else {
        setErrors({ form: j.error ?? "ارسال مجدد ناموفق بود." });
      }
    } catch {
      setErrors({ form: "ارتباط با سرور ناموفق بود." });
    }
    setSubmitting(false);
  };

  const handleOtpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const next = validateOtp();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      const r = await fetch("/api/auth/verify-phone", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          phone: identifier.trim(),
          otp: toAsciiDigits(otp).replace(/\D/g, ""),
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        setStep("done");
      } else if (r.status === 410) {
        setErrors({ form: j.error ?? "کد نامعتبر یا منقضی است." });
        setOtp("");
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

  // ─── Done step ───
  if (step === "done") {
    const successSubtitle =
      identifierKind === "email"
        ? "برای فعال‌سازی حساب، صندوق ورودی ایمیل خود را بررسی کنید."
        : "شماره موبایل شما تأیید شد.";
    const successBody =
      identifierKind === "email"
        ? "یک پیام تأیید به ایمیل شما ارسال شد. روی پیوند داخل پیام کلیک کنید تا حساب شما فعال شود."
        : "حساب شما با موفقیت فعال شد. اکنون می‌توانید وارد شوید.";
    return (
      <AuthLayout
        eyebrow="ثبت‌نام"
        title="حساب شما ساخته شد"
        subtitle={successSubtitle}
        footer={
          <div className="auth-switch">
            حساب دارید؟
            <Link href="/signin">ورود به حساب</Link>
          </div>
        }
      >
        <div className="text-center py-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#f4f3f0] mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          {identifierKind === "email" ? (
            <h2
              ref={successHeadingRef}
              tabIndex={-1}
              className="text-[14px] font-normal text-[#3d3d3d] leading-7 outline-none"
            >
              یک پیام تأیید به{" "}
              <strong className="font-legal font-semibold text-[#1a1a1a]" dir="ltr">
                {identifier.trim()}
              </strong>{" "}
              ارسال شد. روی پیوند داخل پیام کلیک کنید تا حساب شما فعال شود.
            </h2>
          ) : (
            <h2
              ref={successHeadingRef}
              tabIndex={-1}
              className="text-[14px] font-normal text-[#3d3d3d] leading-7 outline-none"
            >
              {successBody}
            </h2>
          )}
          <Link href="/signin" className="auth-submit mt-5" style={{ textDecoration: "none" }}>
            ادامه به ورود
          </Link>
        </div>
      </AuthLayout>
    );
  }

  // ─── OTP step (phone signup) ───
  if (step === "otp") {
    return (
      <AuthLayout
        eyebrow="ثبت‌نام"
        title="کد تأیید را وارد کنید"
        subtitle={`یک کد ۶ رقمی به ${maskIdentifier("phone", identifier)} پیامک شد.`}
        footer={
          <div className="auth-switch">
            شماره اشتباه بود؟
            <button
              type="button"
              onClick={() => {
                setStep("form");
                setOtp("");
                setErrors({});
                setResendIn(0);
              }}
              className="link-legal bg-transparent p-0 border-0 cursor-pointer font-inherit"
            >
              تغییر شماره
            </button>
          </div>
        }
      >
        <form onSubmit={handleOtpSubmit} noValidate className="space-y-5">
          {errors.form && (
            <div className="auth-error-banner" role="alert" style={{
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
            label="کد تأیید"
            htmlFor="otp"
            error={errors.otp}
            hint={errors.otp ? undefined : "کد ۶ رقمی پیامک‌شده را وارد کنید. این کد تنها ۵ دقیقه معتبر است."}
          >
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otp}
              onChange={(e) => {
                const norm = toAsciiDigits(e.target.value).replace(/\D/g, "").slice(0, 6);
                setOtp(norm);
              }}
              placeholder="••••••"
              dir="ltr"
              className={`auth-input auth-code-input ${errors.otp ? "is-error" : ""}`}
              style={{ textAlign: "center", letterSpacing: "0.5em" }}
              autoFocus
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
                در حال بررسی…
              </>
            ) : (
              "تأیید و فعال‌سازی"
            )}
          </button>
          <div className="text-center text-[12.5px] text-[#6b6b6b]">
            {resendIn > 0 ? (
              <>ارسال مجدد کد تا {resendIn} ثانیه دیگر</>
            ) : (
              <button
                type="button"
                onClick={handleOtpResend}
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

  // ─── Default form step ───
  return (
    <AuthLayout
      eyebrow="ثبت‌نام"
      title="ساخت حساب کاربری"
      subtitle="برای ذخیره قوانین موردعلاقه و یادآوری یادداشت‌ها ثبت‌نام کنید."
      footer={
        <div className="auth-switch">
          از قبل حساب دارید؟
          <Link href="/signin">ورود به حساب</Link>
        </div>
      }
    >
      <form onSubmit={handleFormSubmit} noValidate className="space-y-5">
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
        {/* Username */}
        <Field
          label="نام کاربری"
          htmlFor="username"
          error={errors.username}
          hint={errors.username ? undefined : "حداقل ۳ نویسه؛ حروف فارسی یا لاتین، عدد، نقطه و خط تیره."}
        >
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="نام کاربری مورد نظر خود را وارد کنید"
            autoComplete="username"
            className={`auth-input ${errors.username ? "is-error" : ""}`}
          />
        </Field>

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
            placeholder="حداقل ۸ نویسه"
            autoComplete="new-password"
            hasError={!!errors.password}
            showStrength
            ariaLabel="رمز عبور"
          />
        </Field>

        {/* Confirm password */}
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

        {/* Agreement */}
        <div>
          <AgreementCheckbox
            id="agree"
            checked={agree}
            onChange={setAgree}
            hasError={!!errors.agree}
          >
            با{" "}
            <Link href="/privacy" className="link-legal">حریم خصوصی</Link>{" "}
            و{" "}
            <Link href="/terms" className="link-legal">شرایط استفاده</Link>{" "}
            موافقت می‌کنم.
          </AgreementCheckbox>
          {errors.agree && (
            <p className="auth-error" role="alert" style={{ marginTop: "0.5rem" }}>
              {errors.agree}
            </p>
          )}
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
              در حال ساخت حساب…
            </>
          ) : (
            "ثبت‌نام"
          )}
        </button>

        {/* Switch to login */}
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
          ورود به حساب موجود
        </Link>
      </form>
    </AuthLayout>
  );
}
