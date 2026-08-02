import type { Law, LawType, LawStatus } from "./types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind-aware className combiner used by shadcn/ui components. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ----------  Helpers  ----------

/** تبدیل ارقام لاتین به فارسی */
export function toFa(input: string | number): string {
  const faDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(input).replace(/\d/g, (d) => faDigits[parseInt(d, 10)]);
}

/** تبدیل تاریخ میلادی به شمسی (تقریبی، برای نمایش) — الگوریتم ساده */
export function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = (gy <= 1600) ? 0 : 979;
  gy -= (gy <= 1600) ? 621 : 1600;
  const gy2 = (gm > 2) ? (gy + 1) : gy;
  let days = (365 * gy) + (Math.floor((gy2 + 3) / 4)) - (Math.floor((gy2 + 99) / 100)) + (Math.floor((gy2 + 399) / 400)) - 80 + gd + g_d_m[gm - 1];
  jy += 33 * (Math.floor(days / 12053));
  days %= 12053;
  jy += 4 * (Math.floor(days / 1461));
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const jm = (days < 186) ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
  return [jy, jm, jd];
}

/** نام ماه شمسی */
export const jalaliMonths = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
];

export function formatJalaliDate(jalaliStr: string): string {
  // فرض: ورودی به فرمت YYYY/MM/DD شمسی
  const [y, m, d] = jalaliStr.split("/").map((n) => parseInt(n, 10));
  if (!y || !m) return jalaliStr;
  return `${toFa(d || 1)} ${jalaliMonths[m - 1]} ${toFa(y)}`;
}

export function shortJalaliDate(jalaliStr: string): string {
  const [y, m] = jalaliStr.split("/").map((n) => parseInt(n, 10));
  if (!y || !m) return jalaliStr;
  return `${jalaliMonths[m - 1]} ${toFa(y)}`;
}

export function statusLabel(status: LawStatus): string {
  switch (status) {
    case "in-force": return "لازم‌الاجرا";
    case "amended": return "اصلاح‌شده";
    case "revoked": return "منسوخ";
    case "pending": return "در انتظار اجرا";
  }
}

export function statusPillClass(status: LawStatus): string {
  switch (status) {
    case "in-force": return "pill pill-in-force";
    case "amended": return "pill pill-amended";
    case "revoked": return "pill pill-revoked";
    case "pending": return "pill pill-pending";
  }
}

export function typeLabel(type: LawType): string {
  return type;
}

export function lawCitation(law: Law): string {
  return `${law.title} (${toFa(law.year)})`;
}

export function provisionRefLabel(ref: { title: string; year: number; provisionLabel?: string; number?: string }): string {
  const num = ref.number ? ` ش. ${toFa(ref.number)}` : "";
  const prov = ref.provisionLabel ? `، ${ref.provisionLabel}` : "";
  return `${ref.title} (${toFa(ref.year)})${num}${prov}`;
}
