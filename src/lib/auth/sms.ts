/**
 * sms.ir client — sends OTP codes via the /v1/send/verify endpoint
 * (template / pattern-based OTP delivery).
 *
 * Architecture (per the sms.ir developer guide):
 *   - sms.ir is purely a *delivery pipe*. It does NOT store codes, track
 *     TTLs, or count attempts. We generate the OTP ourselves, store its
 *     SHA-256 hash in the `tokens` table (see tokens.ts), and call the
 *     /v1/send/verify endpoint to deliver the plaintext to the user's
 *     mobile. The user types it back; we verify it against the stored
 *     hash. (This is the opposite of Twilio Verify / Vonage Verify,
 *     which manage the code lifecycle for you.)
 *
 *   - Send endpoint: POST https://api.sms.ir/v1/send/verify
 *       Body: { mobile, templateId, parameters: [{ name, value }] }
 *       Headers: X-API-KEY: <key> | Content-Type: application/json
 *       Success: { status: 1, message: "موفق", data: { messageId, cost } }
 *       Failure: { status: <code>, message: "...", data: null }
 *         Common error codes: 10 invalid key, 11 disabled key,
 *         12 IP not whitelisted, 102 insufficient credit,
 *         113 template not found, 114 param value >25 chars,
 *         115 recipient blacklisted, 119 plan upgrade required,
 *         20 too many requests.
 *
 *   - Sandbox: same URLs, separate Sandbox API key. Default template
 *     id 123456 = "کد تایید شما: #CODE#". No real SMS sent, no credit
 *     deducted. The API returns the same shape as production so
 *     end-to-end flow testing is possible without spending credit.
 *
 * Dev fallback: when SMSIR_API_KEY is unset, the OTP is logged to
 * stdout (mirroring the SMTP dev-fallback pattern) and the function
 * resolves as if the SMS was sent — so the full signup/signin/reset
 * flow can be exercised locally without an sms.ir account.
 */

// ── Config ────────────────────────────────────────────────────────────
const API_KEY = process.env.SMSIR_API_KEY ?? "";
const API_BASE = process.env.SMSIR_API_BASE ?? "https://api.sms.ir/v1";
const PARAM_NAME = process.env.SMSIR_PARAM_NAME ?? "Code";

const TEMPLATE_SIGNUP = Number(process.env.SMSIR_TEMPLATE_SIGNUP ?? 123456);
const TEMPLATE_SIGNIN = Number(process.env.SMSIR_TEMPLATE_SIGNIN ?? 123456);
const TEMPLATE_RESET = Number(process.env.SMSIR_TEMPLATE_RESET ?? 123456);

export type SmsPurpose = "signup" | "signin" | "reset";

function templateIdFor(purpose: SmsPurpose): number {
  switch (purpose) {
    case "signup":
      return TEMPLATE_SIGNUP;
    case "signin":
      return TEMPLATE_SIGNIN;
    case "reset":
      return TEMPLATE_RESET;
    default:
      return TEMPLATE_SIGNIN;
  }
}

// ── Types ─────────────────────────────────────────────────────────────
export interface SmsSendResult {
  ok: boolean;
  /** sms.ir messageId on success (null in dev-fallback / on failure). */
  messageId?: number | null;
  /** sms.ir cost on success (null in dev-fallback / on failure). */
  cost?: number | null;
  /** Persian error message for the user (only set when ok=false). */
  error?: string;
  /** sms.ir business status code (only set when ok=false). */
  status?: number;
  /** Underlying error message from sms.ir / network (only set when ok=false). */
  raw?: string;
}

// ── Public API ────────────────────────────────────────────────────────

/**
 * Send a one-time code to a mobile via the sms.ir /v1/send/verify
 * endpoint (template / pattern-based OTP).
 *
 * @param mobile  Iranian mobile normalized to 989XXXXXXXXX (without
 *                leading + or 0). sms.ir accepts both "+98..." and
 *                "98..." and "9..." forms; we always pass the canonical
 *                98XXXXXXXXX form.
 * @param purpose Determines which templateId is used (signup / signin /
 *                reset). The template text contains a #CODE#-style
 *                placeholder that sms.ir substitutes with the OTP.
 * @param code    The 6-digit OTP plaintext that sms.ir will substitute
 *                into the template. Max 25 chars (sms.ir hard limit,
 *                status code 114 otherwise).
 */
export async function sendOtp(
  mobile: string,
  purpose: SmsPurpose,
  code: string
): Promise<SmsSendResult> {
  // Dev fallback — no API key configured → log and pretend success.
  // Mirrors the SMTP dev-fallback in src/auth.ts so the whole auth
  // flow is testable without an sms.ir account.
  if (!API_KEY) {
    console.warn(
      `[sms] SMSIR_API_KEY is not set — OTP for ${mobile} (${purpose}) will be logged to stdout instead of sent.`
    );
    console.log(`[sms][dev] OTP for ${mobile} (${purpose}) → ${code}`);
    return { ok: true, messageId: null, cost: null };
  }

  const templateId = templateIdFor(purpose);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/send/verify`, {
      method: "POST",
      headers: {
        "X-API-KEY": API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        mobile,
        templateId,
        parameters: [{ name: PARAM_NAME, value: code }],
      }),
      // Don't let a hung sms.ir request block the Next.js request
      // indefinitely. 10s is the documented worst-case for their API;
      // the caller surfaces a Persian "try again later" on timeout.
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      error: "ارسال پیامک ناموفق بود. لطفاً بعداً تلاش کنید.",
      raw: `network_error: ${msg}`,
    };
  }

  // Parse JSON body. sms.ir always returns JSON for the verify endpoint,
  // but tolerate an empty/non-JSON body (5xx with HTML error page etc.).
  type SmsirResponse = {
    status?: number;
    message?: string;
    data?: { messageId?: number; cost?: number } | null;
  };
  let payload: SmsirResponse | null = null;
  try {
    payload = (await res.json()) as SmsirResponse;
  } catch {
    payload = null;
  }

  // Network/transport failure (5xx, network island, etc.)
  if (!res.ok && !payload) {
    return {
      ok: false,
      error: "سرویس پیامک در دسترس نیست. لطفاً بعداً تلاش کنید.",
      status: res.status,
      raw: `http_${res.status}`,
    };
  }

  const status = payload?.status;
  const message = payload?.message ?? "";
  const data = payload?.data ?? null;

  // sms.ir success indicator: status === 1 (regardless of HTTP 200)
  if (status === 1 && data) {
    return {
      ok: true,
      messageId: data.messageId ?? null,
      cost: data.cost ?? null,
    };
  }

  // Map the most common failure codes to Persian user-facing messages.
  // (The full list is in the sms.ir developer guide; the 8 below cover
  // ~99% of real-world failures that a user can act on.)
  return {
    ok: false,
    status: status ?? res.status,
    error: mapStatusToPersian(status, message),
    raw: message,
  };
}

function mapStatusToPersian(status: number | undefined, raw: string): string {
  switch (status) {
    case 10:
    case 11:
    case 12:
    case 13:
    case 14:
      // All authentication / account-state issues look the same to the
      // end user — they can't fix the SMS provider's account from here.
      return "سرویس پیامک موقتاً در دسترس نیست. لطفاً بعداً تلاش کنید.";
    case 20:
      return "تعداد درخواست‌های پیامک بیش از حد مجاز است. لطفاً کمی بعد تلاش کنید.";
    case 102:
      return "اعتبار پیامک کافی نیست. لطفاً با پشتیبانی تماس بگیرید.";
    case 104:
      return "شماره موبایل نامعتبر است.";
    case 113:
      return "قالب پیامک پیکربندی نشده است. لطفاً با پشتیبانی تماس بگیرید.";
    case 114:
      return "متن کد بیش از حد طولانی است."; // shouldn't happen for a 6-digit OTP
    case 115:
      return "این شماره در لیست سیاه پیامک قرار دارد.";
    case 119:
      return "قالب اختصاصی پیامک فعال نیست. لطفاً با پشتیبانی تماس بگیرید.";
    case 123:
      return "خط فرستنده نیاز به تأیید دارد. لطفاً با پشتیبانی تماس بگیرید.";
    default:
      // Unknown / unmapped status — surface a generic Persian error but
      // preserve the raw sms.ir message in the `raw` field for logs.
      return `ارسال پیامک ناموفق بود. (${status ?? "unknown"}) ${raw}`.trim();
  }
}
