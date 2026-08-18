/**
 * Identifier helpers — normalize + validate Iranian mobile numbers and
 * emails so the same value lands in the DB regardless of how the user
 * typed it.
 *
 * Phone canonical form: "989XXXXXXXXX" (no leading +, no leading 0).
 *   - "09123456789"  → "989123456789"
 *   - "9123456789"   → "989123456789"
 *   - "+989123456789" → "989123456789"
 *   - "989123456789"  → "989123456789"
 *   - "۰۹۱۲۳۴۵۶۷۸۹" (Persian digits) → "989123456789"
 *
 * sms.ir accepts both "+98..." and "98..." forms, so we use the shorter
 * canonical form. The DB stores this exact string; the partial unique
 * index on (phone WHERE phone IS NOT NULL) enforces uniqueness.
 *
 * Email canonical form: lowercased + trimmed.
 */

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** Convert Persian/Arabic digits to ASCII digits. */
export function toAsciiDigits(s: string): string {
  return s.replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)));
}

/**
 * Validate + normalize an Iranian mobile number to the canonical
 * "989XXXXXXXXX" form.
 *
 * Returns null if the input is not a valid Iranian mobile (must start
 * with 09 or +989 or 989 or 9 after stripping non-digits, and total
 * significant digits must be 10 after the country code).
 */
export function normalizePhone(raw: string | undefined | null): string | null {
  if (!raw) return null;
  // Persian/Arabic digits → ASCII
  let s = toAsciiDigits(raw).trim();
  // Strip spaces, dashes, parens
  s = s.replace(/[\s\-()]/g, "");
  if (!s) return null;

  // Strip the leading +
  if (s.startsWith("+")) s = s.slice(1);

  // Strip the leading 00 (international prefix written long-form)
  if (s.startsWith("00")) s = s.slice(2);

  // Now we have one of: 989XXXXXXXXX | 09XXXXXXXXX | 9XXXXXXXXX
  if (s.startsWith("98")) {
    // strip the country code, expect 10 digits after
    const rest = s.slice(2);
    if (rest.length !== 10 || !rest.startsWith("9")) return null;
    if (!/^\d{10}$/.test(rest)) return null;
    return s;
  }
  if (s.startsWith("0")) {
    // Local form 09XXXXXXXXX → strip the 0, expect 10 digits
    const rest = s.slice(1);
    if (rest.length !== 10 || !rest.startsWith("9")) return null;
    if (!/^\d{10}$/.test(rest)) return null;
    return `98${rest}`;
  }
  // Bare form 9XXXXXXXXX → expect 10 digits
  if (s.length === 10 && s.startsWith("9") && /^\d{10}$/.test(s)) {
    return `98${s}`;
  }
  return null;
}

/** True iff the raw input parses to a valid Iranian mobile. */
export function isValidPhone(raw: string | undefined | null): boolean {
  return normalizePhone(raw) !== null;
}

/**
 * Normalize an email to the canonical lowercased-trimmed form used by
 * the auth system. Returns null for syntactically-invalid addresses.
 *
 * (Mirrors the Zod .email() check we already use at the route layer —
 * duplicated here so callers can normalize without a Zod dependency.)
 */
export function normalizeEmail(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const s = raw.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return null;
  return s;
}

/**
 * Mask an identifier so the verify-step subtitle doesn't leak the full
 * email/phone on screen (anti-shoulder-surfing).
 *
 *   email  "modavanat@gmail.com" → "mo••••••@gmail.com"
 *   phone  "989123456789"        → "989••••••89"
 */
export function maskIdentifier(kind: "email" | "phone", value: string): string {
  const v = value.trim();
  if (kind === "email") {
    const [name, domain] = v.split("@");
    if (!domain) return v;
    const visible = name.slice(0, Math.min(2, name.length));
    return `${visible}${"•".repeat(Math.max(2, name.length - 2))}@${domain}`;
  }
  // phone — keep country code (98) + last 2 digits
  const normalized = normalizePhone(v) ?? toAsciiDigits(v).replace(/\D/g, "");
  if (normalized.length < 6) return normalized;
  const head = normalized.slice(0, 3);
  const tail = normalized.slice(-2);
  return `${head}${"•".repeat(normalized.length - 5)}${tail}`;
}

/**
 * Convert the canonical "989XXXXXXXXX" phone to a user-friendly
 * local display form "0912 345 6789" for UIs.
 */
export function formatPhoneDisplay(canonical: string): string {
  if (!canonical || !canonical.startsWith("98") || canonical.length !== 12) {
    return canonical;
  }
  const local = "0" + canonical.slice(2);
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
}
