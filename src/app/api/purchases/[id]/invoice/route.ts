/**
 * GET /api/purchases/[id]/invoice
 *
 * Returns a standalone, printable HTML invoice for the given
 * purchase. The HTML auto-triggers `window.print()` on load, so
 * the user can save it as PDF via the browser's print dialog.
 *
 * Auth: must be signed in as the owner of the purchase. Returns
 * 401 for unauthenticated callers, 404 for purchases that don't
 * exist or belong to another user (we deliberately don't reveal
 * which — both cases return 404 to avoid leaking purchase IDs).
 *
 * Why HTML+print instead of a server-side PDF library?
 *   1. Persian RTL text in PDF libs (pdfkit, react-pdf) requires
 *      complex script shaping that's fragile without a real
 *      text-layout engine. Browsers already do this perfectly.
 *   2. The browser's "Save as PDF" produces a higher-quality,
 *      selectable-text PDF than most server-side renderers.
 *   3. Zero new npm dependencies.
 *
 * The HTML uses the same self-hosted Vazirmatn font as the rest
 * of the site, so the invoice matches the brand.
 */
import { db } from "@/db/client";
import { purchases, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getUserFromSession } from "@/lib/auth/session";
import { toFa, gregorianToJalali } from "@/lib/utils";

function formatAmount(amount: number): string {
  // Thousand separators (Persian-style) + Persian digits.
  const grouped = new Intl.NumberFormat("en-US").format(amount);
  return toFa(grouped);
}

function formatJalali(iso: string | Date | null): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "—";
  const [jy, jm, jd] = gregorianToJalali(
    d.getUTCFullYear(),
    d.getUTCMonth() + 1,
    d.getUTCDate()
  );
  const months = [
    "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
    "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
  ];
  return `${toFa(jd)} ${months[jm - 1]} ${toFa(jy)}`;
}

function statusLabel(status: string): string {
  switch (status) {
    case "paid": return "پرداخت شده";
    case "pending": return "در انتظار پرداخت";
    case "refunded": return "بازگردانده شده";
    case "failed": return "ناموفق";
    default: return status;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const u = await getUserFromSession();
  if (!u) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { id } = await params;

  const rows = await db
    .select({
      id: purchases.id,
      description: purchases.description,
      amount: purchases.amount,
      currency: purchases.currency,
      status: purchases.status,
      method: purchases.method,
      invoiceNumber: purchases.invoiceNumber,
      paidAt: purchases.paidAt,
      createdAt: purchases.createdAt,
    })
    .from(purchases)
    .where(and(eq(purchases.id, id), eq(purchases.userId, u.id)))
    .limit(1);
  if (rows.length === 0) {
    return new Response("Not Found", { status: 404 });
  }
  const p = rows[0];

  const userRow = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, u.id))
    .limit(1);
  const userName = userRow[0]?.name ?? "";
  const userEmail = userRow[0]?.email ?? "";

  const invoiceNumber = p.invoiceNumber ?? p.id.slice(0, 8).toUpperCase();
  const issueDate = formatJalali(p.paidAt ?? p.createdAt);
  const amountLabel = `${formatAmount(p.amount)} ${p.currency === "IRT" ? "تومان" : p.currency}`;
  const methodLabel = p.method ?? "—";
  const statusText = statusLabel(p.status);
  const title = `فاکتور ${escapeHtml(invoiceNumber)}`;

  const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    @font-face {
      font-family: "vazirmatn";
      src: url("/fonts/vazirmatn-arabic.woff2") format("woff2");
      font-weight: 100 900;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: "vazirmatn";
      src: url("/fonts/vazirmatn-latin.woff2") format("woff2");
      font-weight: 100 900;
      font-style: normal;
      font-display: swap;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      font-family: "vazirmatn", "Tahoma", "Arial", sans-serif;
      color: #1a1a1a;
      background: #fff;
      line-height: 1.7;
    }
    .page {
      max-width: 800px;
      margin: 0 auto;
      padding: 32px 40px;
    }
    .topbar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 18px;
      border-bottom: 2px solid #1a1a1a;
    }
    .brand {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.02em;
    }
    .brand-sub {
      font-size: 11.5px;
      color: #6b6b6b;
      margin-top: 2px;
    }
    .doc-label {
      text-align: left;
    }
    .doc-label .kind {
      font-size: 11px;
      letter-spacing: 0.18em;
      color: #6b6b6b;
      text-transform: uppercase;
    }
    .doc-label .num {
      font-size: 18px;
      font-weight: 600;
      margin-top: 4px;
    }
    h1 {
      font-size: 26px;
      font-weight: 300;
      margin: 28px 0 4px 0;
    }
    .subtitle {
      font-size: 13px;
      color: #6b6b6b;
      margin-bottom: 24px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
    }
    .meta-block .label {
      font-size: 11px;
      letter-spacing: 0.12em;
      color: #6b6b6b;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .meta-block .value {
      font-size: 14.5px;
      font-weight: 500;
    }
    table.items {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    table.items thead th {
      background: #f6f6f4;
      border-bottom: 1px solid #d4d4d2;
      padding: 10px 12px;
      font-size: 12px;
      font-weight: 600;
      text-align: right;
      letter-spacing: 0.08em;
      color: #4a4a4a;
    }
    table.items tbody td {
      padding: 14px 12px;
      border-bottom: 1px solid #ececea;
      font-size: 14px;
      vertical-align: top;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 0;
      border-top: 2px solid #1a1a1a;
      margin-top: 8px;
    }
    .total-row .label {
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.05em;
    }
    .total-row .amount {
      font-size: 22px;
      font-weight: 700;
    }
    .status-pill {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 4px;
      font-size: 11.5px;
      font-weight: 600;
      background: ${p.status === "paid" ? "#dcfce7" : p.status === "pending" ? "#fef9c3" : "#fee2e2"};
      color: ${p.status === "paid" ? "#166534" : p.status === "pending" ? "#854d0e" : "#991b1b"};
    }
    .footer {
      margin-top: 40px;
      padding-top: 18px;
      border-top: 1px solid #ececea;
      font-size: 12px;
      color: #6b6b6b;
      line-height: 1.8;
    }
    .footer strong { color: #1a1a1a; }
    .toolbar {
      display: flex;
      gap: 8px;
      margin-bottom: 24px;
    }
    .toolbar button {
      font-family: inherit;
      font-size: 13px;
      padding: 8px 16px;
      background: #1a1a1a;
      color: #fff;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }
    .toolbar button.secondary {
      background: transparent;
      color: #1a1a1a;
      border: 1px solid #d4d4d2;
    }
    @media print {
      .toolbar { display: none; }
      .page { padding: 0; max-width: none; }
      @page { margin: 16mm; size: A4; }
    }
  </style>
</head>
<body onload="window.print()">
  <div class="page">
    <div class="toolbar">
      <button type="button" onclick="window.print()">چاپ / ذخیره به‌عنوان PDF</button>
      <button type="button" class="secondary" onclick="window.close()">بستن</button>
    </div>
    <div class="topbar">
      <div>
        <div class="brand">مدونات</div>
        <div class="brand-sub">پایگاه مرجع قوانین ایران</div>
      </div>
      <div class="doc-label">
        <div class="kind">فاکتور فروش</div>
        <div class="num">شماره ${escapeHtml(invoiceNumber)}</div>
      </div>
    </div>

    <h1>فاکتور رسمی</h1>
    <p class="subtitle">این فاکتور توسط سامانه مدونات صادر شده است و به‌عنوان رسید پرداخت معتبر است.</p>

    <div class="meta-grid">
      <div class="meta-block">
        <div class="label">صادر شده برای</div>
        <div class="value">${escapeHtml(userName || "—")}</div>
        <div class="value" style="font-size: 13px; color: #6b6b6b; font-weight: 400;">${escapeHtml(userEmail)}</div>
      </div>
      <div class="meta-block">
        <div class="label">تاریخ صدور</div>
        <div class="value">${issueDate}</div>
      </div>
    </div>

    <table class="items">
      <thead>
        <tr>
          <th style="width: 60%;">شرح</th>
          <th>روش پرداخت</th>
          <th>وضعیت</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${escapeHtml(p.description)}</td>
          <td>${escapeHtml(methodLabel)}</td>
          <td><span class="status-pill">${statusText}</span></td>
        </tr>
      </tbody>
    </table>

    <div class="total-row">
      <span class="label">مبلغ نهایی</span>
      <span class="amount">${escapeHtml(amountLabel)}</span>
    </div>

    <div class="footer">
      <p><strong>مدونات (modavanat.ir)</strong> — پروژه غیرانتفاعی مرجع قوانین ایران.</p>
      <p>در صورت وجود هرگونه سؤال درباره این فاکتور، با نشانی <a href="mailto:info@modavanat.ir" style="color: inherit;">info@modavanat.ir</a> تماس بگیرید. شماره تیکت پشتیبانی: <strong>${escapeHtml(invoiceNumber)}</strong>.</p>
      <p style="margin-top: 12px; font-size: 11px;">این فاکتور توسط سامانه تولید شده و فاقد امضای کتبی است.</p>
    </div>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
