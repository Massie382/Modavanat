"use client";

import { Suspense, useState, FormEvent, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Field, PasswordInput, AgreementCheckbox } from "@/components/auth/AuthFields";
import { normalizePhone, toAsciiDigits, maskIdentifier } from "@/lib/auth/identifier";

type IdentifierKind = "email" | "phone";
type Step = "credentials" | "otp" | "success";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/account";
  const verified = searchParams.get("verified") === "1";

  const [step, setStep] = useState<Step>("credentials");
  const [identifierKind, setIdentifierKind] = useState<IdentifierKind>("email");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{
    identifier?: string | null;
    password?: string | null;
    otp?: string | null;
    form?: string | null;
  }>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  // Resend cooldown — counts down from 60s after an OTP is sent.
  const [resendIn, setResendIn] = useState(0);
  const resendTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Move focus to the success message heading when the simulated success
  // state is entered, so screen-reader users hear the context change.
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (submitted) {
      successHeadingRef.current?.focus();
    }
  }, [submitted]);

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

  const placeholder =
    identifierKind === "email"
      ? "نام کاربری یا ایمیل خود را وارد کنید"
      : "۰۹۱۲۳۴۵۶۷۸۹";

  const validateCredentials = () => {
    const next: typeof errors = {};
    const v = identifier.trim();
    if (!v) {
      next.identifier = "لطفاً ایمیل یا شماره تلفن خود را وارد کنید.";
    } else if (identifierKind === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      next.identifier = "قالب ایمیل معتبر نیست.";
    } else if (identifierKind === "phone") {
      const norm = normalizePhone(v);
      if (!norm) {
        next.identifier = "شماره تلفن باید با ۰۹ شروع شود و ۱۱ رقم باشد.";
      }
    }
    if (!password) {
      next.password = "رمز عبور را وارد کنید.";
    } else if (password.length < 6) {
      next.password = "رمز عبور باید حداقل ۶ نویسه باشد.";
    }
    return next;
  };

  const validateOtp = () => {
    const next: typeof errors = {};
    const norm = toAsciiDigits(otp).replace(/\D/g, "");
    if (!norm) next.otp = "کد تأیید را وارد کنید.";
    else if (norm.length !== 6) next.otp = "کد تأیید باید ۶ رقم باشد.";
    return next;
  };

  // ── Step 1 (credentials) submit ──
  const handleCredentialsSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const next = validateCredentials();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    setErrors({});

    // Phone path: send OTP, move to OTP step. The OTP is verified
    // server-side in the NextAuth `authorize` callback (Branch A).
    if (identifierKind === "phone") {
      try {
        const r = await fetch("/api/auth/phone-otp/send", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ phone: identifier.trim() }),
        });
        const j = await r.json().catch(() => ({}));
        if (r.ok) {
          setStep("otp");
          startResendCooldown();
        } else if (r.status === 429) {
          setErrors({ form: j.error ?? "تلاش‌های بیش از حد. لطفاً بعداً تلاش کنید." });
        } else if (r.status === 502) {
          setErrors({ form: j.error ?? "ارسال پیامک ناموفق بود. لطفاً دوباره تلاش کنید." });
        } else {
          setErrors({ form: j.error ?? "خطایی رخ داد. لطفاً دوباره تلاش کنید." });
        }
      } catch {
        setErrors({ form: "ارتباط با سرور ناموفق بود." });
      }
      setSubmitting(false);
      return;
    }

    // Email path: call NextAuth credentials sign-in directly.
    const res = await signIn("credentials", {
      email: identifier.trim().toLowerCase(),
      password,
      redirect: false,
      callbackUrl,
    });
    setSubmitting(false);

    if (res?.error) {
      setErrors({
        form: "ایمیل یا رمز عبور نادرست است. اگر چند بار اشتباه وارد کنید، حساب موقتاً قفل می‌شود.",
      });
      return;
    }
    if (res?.url) {
      setSubmitted(true);
      setTimeout(() => {
        router.replace(res.url ?? callbackUrl);
        router.refresh();
      }, 600);
      return;
    }
    setErrors({ form: "خطایی ناشناخته رخ داد. لطفاً دوباره تلاش کنید." });
  };

  // ── Step 2 (phone OTP) resend ──
  const handleResend = async () => {
    if (resendIn > 0 || submitting) return;
    setErrors({});
    setSubmitting(true);
    try {
      const r = await fetch("/api/auth/phone-otp/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: identifier.trim() }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        startResendCooldown();
        setOtp("");
      } else if (r.status === 429) {
        setErrors({ form: j.error ?? "تلاش‌های بیش از حد. لطفاً بعداً تلاش کنید." });
      } else {
        setErrors({ form: j.error ?? "ارسال مجدد ناموفق بود." });
      }
    } catch {
      setErrors({ form: "ارتباط با سرور ناموفق بود." });
    }
    setSubmitting(false);
  };

  // ── Step 2 (phone OTP) submit — verify the OTP via NextAuth ──
  const handleOtpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const next = validateOtp();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    setErrors({});
    const normalizedOtp = toAsciiDigits(otp).replace(/\D/g, "");
    const res = await signIn("credentials", {
      phone: identifier.trim(),
      otp: normalizedOtp,
      purpose: "phone-otp",
      redirect: false,
      callbackUrl,
    });
    setSubmitting(false);

    if (res?.error) {
      setErrors({
        form: "کد نامعتبر یا منقضی است. می‌توانید کد را دوباره درخواست کنید.",
      });
      setOtp("");
      return;
    }
    if (res?.url) {
      setSubmitted(true);
      setTimeout(() => {
        router.replace(res.url ?? callbackUrl);
        router.refresh();
      }, 600);
      return;
    }
    setErrors({ form: "خطایی ناشناخته رخ داد. لطفاً دوباره تلاش کنید." });
  };

  // ─── Success screen ───
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
          <h2
            ref={successHeadingRef}
            tabIndex={-1}
            className="text-[14px] font-normal text-[#3d3d3d] leading-7 outline-none"
          >
            ورود موفقیت‌آمیز بود. اگر به‌صورت خودکار منتقل نشدید،
            <Link href={callbackUrl} className="link-legal mr-1">اینجا را کلیک کنید</Link>.
          </h2>
        </div>
      </AuthLayout>
    );
  }

  // ─── OTP entry step (phone kind only) ───
  if (step === "otp") {
    return (
      <AuthLayout
        eyebrow="ورود به حساب"
        title="کد تأیید را وارد کنید"
        subtitle={`یک کد ۶ رقمی به ${maskIdentifier("phone", identifier)} پیامک شد.`}
        footer={
          <div className="auth-switch">
            شماره اشتباه بود؟
            <button
              type="button"
              onClick={() => {
                setStep("credentials");
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
            hint={errors.otp ? undefined : "کد ۶ رقمی پیامک‌شده را وارد کنید. این کد تنها ۳ دقیقه معتبر است."}
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
              "تأیید و ورود"
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

  // ─── Credentials step (default) ───
  return (
    <AuthLayout
      eyebrow="ورود به حساب"
      title="خوش آمدید"
      subtitle={verified ? "ایمیل شما تأیید شد. اکنون می‌توانید وارد شوید." : "برای دسترسی به امکانات شخصی مدونات وارد شوید."}
      footer={
        <div className="auth-switch">
          حساب کاربری ندارید؟
          <Link href="/signup">ثبت‌نام کنید</Link>
        </div>
      }
    >
      <form onSubmit={handleCredentialsSubmit} noValidate className="space-y-5">
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
        {verified && !errors.form && (
          <div className="auth-success-banner" style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            color: "#15803d",
            padding: "0.75rem 1rem",
            borderRadius: 6,
            fontSize: 13,
          }}>
            ایمیل شما با موفقیت تأیید شد.
          </div>
        )}

        {/* Identifier selector */}
        <div>
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
          label={identifierKind === "email" ? "ایمیل" : "شماره موبایل"}
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

        {/* Password (email kind only — phone kind uses OTP) */}
        {identifierKind === "email" && (
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
        )}

        {/* Phone-kind help text */}
        {identifierKind === "phone" && (
          <p className="text-[12.5px] text-[#6b6b6b] -mt-1">
            با انتخاب «ورود» یک کد ۶ رقمی به شماره شما پیامک می‌شود.
          </p>
        )}

        {/* Remember + forgot (email kind only) */}
        {identifierKind === "email" && (
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
        )}

        {/* Submit */}
        <button
          type="submit"
          className="auth-submit"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              {identifierKind === "phone" ? "در حال ارسال کد…" : "در حال ورود…"}
            </>
          ) : (
            identifierKind === "phone" ? "ارسال کد ورود" : "ورود به حساب"
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

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <SignInForm />
    </Suspense>
  );
}
