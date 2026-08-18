"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Field, PasswordInput, AgreementCheckbox } from "@/components/auth/AuthFields";

type IdentifierKind = "email" | "phone";

export default function SignUpPage() {
  const [username, setUsername] = useState("");
  const [identifierKind, setIdentifierKind] = useState<IdentifierKind>("email");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string | null;
    identifier?: string | null;
    password?: string | null;
    confirm?: string | null;
    agree?: string | null;
    form?: string | null;
  }>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Move focus to the success message heading when the simulated
  // "verification email sent" state is entered.
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (done) {
      successHeadingRef.current?.focus();
    }
  }, [done]);

  const identifierLabel =
    identifierKind === "email" ? "ایمیل" : "شماره تلفن";
  const placeholder =
    identifierKind === "email"
      ? "example@modavanat.ir"
      : "۰۹۱۲۳۴۵۶۷۸۹";

  const validate = () => {
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
      // phone — accept Persian or ASCII digits
      const normalized = id.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
      if (!/^0?9\d{9}$/.test(normalized)) {
        next.identifier = "شماره تلفن باید با ۰۹ شروع شود و ۱۱ رقم باشد.";
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    // POST to the real /api/auth/signup endpoint which creates the
    // user row (scrypt-hashed password) + sends a verification magic
    // link via the `tokens` table.
    try {
      const r = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: username.trim(),
          email: identifier.trim().toLowerCase(),
          password,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        setDone(true);
      } else if (r.status === 409) {
        setErrors({ identifier: j.error ?? "این ایمیل قبلاً ثبت شده است." });
      } else if (r.status === 429) {
        setErrors({ form: j.error ?? "تلاش‌های بیش از حد. لطفاً بعداً تلاش کنید." });
      } else {
        setErrors({ form: j.error ?? "خطایی در زمان ثبت‌نام رخ داد." });
      }
    } catch {
      setErrors({ form: "ارتباط با سرور ناموفق بود. لطفاً دوباره تلاش کنید." });
    }
    setSubmitting(false);
  };

  if (done) {
    return (
      <AuthLayout
        eyebrow="ثبت‌نام"
        title="حساب شما ساخته شد"
        subtitle="برای فعال‌سازی حساب، لطفاً صندوق ورودی ایمیل خود را بررسی کنید."
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
          <Link href="/signin" className="auth-submit mt-5" style={{ textDecoration: "none" }}>
            ادامه به ورود
          </Link>
        </div>
      </AuthLayout>
    );
  }

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
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
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
