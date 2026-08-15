"use client";

import { cloneElement, isValidElement, useState, type ReactElement } from "react";

/* ───────────────────────────────────────────────────────────────────────
   Reusable form field primitives for the auth pages (/signin, /signup).
   Kept in a single file because they're small and tightly co-used.
   ─────────────────────────────────────────────────────────────────────── */

interface FieldProps {
  label: string;
  htmlFor?: string;
  error?: string | null;
  hint?: string;
  /** When true, the wrapped input gets `aria-invalid="true"` and the
   *  `input-error` class so callers don't have to wire both manually. */
  hasError?: boolean;
  children: React.ReactNode;
}

/** Labeled field wrapper — renders label + input + error/hint text.
 *  When `hasError` is set, the single child input is cloned with
 *  `aria-invalid="true"` and the `input-error` CSS class injected
 *  (merged with any className the caller already passed). */
export function Field({ label, htmlFor, error, hint, hasError, children }: FieldProps) {
  const decorated =
    hasError && isValidElement(children)
      ? cloneElement(children as ReactElement<Record<string, unknown>>, {
          "aria-invalid": true,
          className: [
            ((children.props as { className?: string }).className ?? "").trim(),
            "input-error",
          ].filter(Boolean).join(" "),
        })
      : children;

  return (
    <div>
      <label htmlFor={htmlFor} className="auth-label">
        {label}
      </label>
      {decorated}
      {error ? (
        <p className="auth-error" role="alert">{error}</p>
      ) : hint ? (
        <p className="auth-hint">{hint}</p>
      ) : null}
    </div>
  );
}

/** Eye icon shown when password is hidden. */
function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/** Eye-off icon shown when password is visible. */
function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-6.5 0-10-7-10-7a18.4 18.4 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A10.6 10.6 0 0 1 12 4c6.5 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  hasError?: boolean;
  /** Whether to also show the strength meter (signup only) */
  showStrength?: boolean;
  ariaLabel?: string;
}

/**
 * Password input with an eye toggle for show/hide.
 * Optionally renders a 4-segment strength meter below the input.
 */
export function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  autoComplete,
  hasError,
  showStrength,
  ariaLabel,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  const strength = scorePassword(value);
  const strengthLabel = strength === 0 ? "" :
    strength === 1 ? "ضعیف" :
    strength === 2 ? "متوسط" :
    strength === 3 ? "خوب" :
    "قوی";

  return (
    <div>
      <div className="auth-password">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-label={ariaLabel}
          aria-invalid={hasError ? true : undefined}
          className={`auth-input ${hasError ? "is-error input-error" : ""}`}
          dir="ltr"
          style={{ textAlign: "right" }}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="auth-password-toggle"
          aria-label={visible ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"}
          tabIndex={-1}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>

      {showStrength && value.length > 0 && (
        <div>
          <div className="auth-strength" aria-hidden>
            <div className={`auth-strength-seg ${strength >= 1 ? `s${strength}` : ""}`} />
            <div className={`auth-strength-seg ${strength >= 2 ? `s${strength}` : ""}`} />
            <div className={`auth-strength-seg ${strength >= 3 ? `s${strength}` : ""}`} />
            <div className={`auth-strength-seg ${strength >= 4 ? `s${strength}` : ""}`} />
          </div>
          <p className="auth-strength-label">
            قدرت رمز عبور: <span style={{ color: "var(--ink-soft)", fontWeight: 500 }}>{strengthLabel}</span>
          </p>
        </div>
      )}
    </div>
  );
}

/** Check icon for the custom checkbox. */
function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="3 8.5 6.5 12 13 4.5" />
    </svg>
  );
}

interface AgreementCheckboxProps {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hasError?: boolean;
  children: React.ReactNode;
}

/**
 * Custom agreement checkbox — 16px charcoal-filled square with white check
 * when checked. The label content is passed as children so it can include
 * links (e.g. to privacy policy and terms of use).
 */
export function AgreementCheckbox({
  id,
  checked,
  onChange,
  hasError,
  children,
}: AgreementCheckboxProps) {
  return (
    <label htmlFor={id} className={`auth-check ${hasError ? "is-error" : ""}`}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="auth-check-box">
        <CheckIcon />
      </span>
      <span className="auth-check-label">{children}</span>
    </label>
  );
}

/* ── Password strength scoring ──
   Returns 0–4 based on length + character class mix. Purely advisory —
   the actual submit-time validation just enforces a minimum length. */
function scorePassword(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  const hasLower = /[a-z]/.test(pw);
  const hasUpper = /[A-Z]/.test(pw);
  const hasDigit = /\d/.test(pw);
  const hasOther = /[^a-zA-Z0-9]/.test(pw);
  const classes = [hasLower, hasUpper, hasDigit, hasOther].filter(Boolean).length;
  if (classes >= 2) score++;
  if (classes >= 3 && pw.length >= 8) score++;
  return Math.min(score, 4);
}
