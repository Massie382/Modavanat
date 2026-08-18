"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

const CATEGORIES = [
  { value: "content-error", label: "گزارش خطای محتوایی" },
  { value: "technical", label: "گزارش مشکل فنی" },
  { value: "accessibility", label: "دسترسی‌پذیری" },
  { value: "law-request", label: "درخواست افزودن قانون" },
  { value: "collaboration", label: "همکاری" },
  { value: "other", label: "سایر موارد" },
] as const;

type Category = (typeof CATEGORIES)[number]["value"];

export function ContactForm() {
  const { data: session } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<Category>("content-error");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string; ticketId?: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-fill name + email from the signed-in session, but let the
  // user override if they want to use a different reply address.
  useEffect(() => {
    if (session?.user) {
      setName(session.user.name ?? "");
      setEmail(session.user.email ?? "");
    }
  }, [session]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (name && name.trim().length < 2) next.name = "نام باید حداقل ۲ نویسه باشد.";
    if (!email.trim()) next.email = "ایمیل الزامی است.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "ساختار ایمیل نامعتبر است.";
    if (!subject.trim()) next.subject = "موضوع الزامی است.";
    else if (subject.trim().length < 5) next.subject = "موضوع باید حداقل ۵ نویسه باشد.";
    if (!body.trim()) next.body = "متن پیام الزامی است.";
    else if (body.trim().length < 5) next.body = "متن پیام باید حداقل ۵ نویسه باشد.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setResult(null);
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          email: email.trim(),
          category: CATEGORIES.find((c) => c.value === category)?.label ?? "سایر موارد",
          subject: subject.trim(),
          body: body.trim(),
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        setResult({
          ok: true,
          message: "پیام شما با موفقیت ثبت شد. تیم پشتیبانی ظرف ۵ روز کاری پاسخ خواهد داد.",
          ticketId: j.id as string | undefined,
        });
        // Reset the form on success but keep name/email (they're the
        // signed-in user's identity).
        setSubject("");
        setBody("");
        setCategory("content-error");
      } else {
        setResult({
          ok: false,
          message: j.error ?? "ارسال پیام ناموفق بود. لطفاً چند لحظه بعد دوباره تلاش کنید.",
        });
      }
    } catch {
      setResult({
        ok: false,
        message: "ارتباط با سرور ناموفق بود. لطفاً اتصال اینترنت خود را بررسی کنید.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {result?.ok && (
        <div className="my-4 p-4 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-800 text-[13.5px]" role="status">
          <strong className="font-semibold">پیام ثبت شد.</strong> {result.message}
          {result.ticketId && (
            <span className="block mt-1 text-[12px] text-emerald-700">
              شماره تیکت پیگیری: {result.ticketId.slice(0, 8).toUpperCase()}
            </span>
          )}
        </div>
      )}
      {result && !result.ok && (
        <div className="my-4 p-4 rounded-md border border-red-200 bg-red-50 text-red-800 text-[13.5px]" role="alert">
          {result.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 mt-4" noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="contact-name" className="block text-[13px] font-medium text-[#1a1a1a] mb-1">
              نام (اختیاری)
            </label>
            <input
              id="contact-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              autoComplete="name"
              className="w-full px-3 py-2 rounded-md border border-[#d4d4d2] bg-white text-[14px] focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
              disabled={submitting}
            />
            {errors.name && <p className="mt-1 text-[12px] text-red-700">{errors.name}</p>}
          </div>
          <div>
            <label htmlFor="contact-email" className="block text-[13px] font-medium text-[#1a1a1a] mb-1">
              ایمیل <span className="text-red-700">*</span>
            </label>
            <input
              id="contact-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={200}
              autoComplete="email"
              required
              dir="ltr"
              className="w-full px-3 py-2 rounded-md border border-[#d4d4d2] bg-white text-[14px] focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
              disabled={submitting}
            />
            {errors.email && <p className="mt-1 text-[12px] text-red-700">{errors.email}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="contact-category" className="block text-[13px] font-medium text-[#1a1a1a] mb-1">
            دسته‌بندی
          </label>
          <select
            id="contact-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="w-full px-3 py-2 rounded-md border border-[#d4d4d2] bg-white text-[14px] focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
            disabled={submitting}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="contact-subject" className="block text-[13px] font-medium text-[#1a1a1a] mb-1">
            موضوع <span className="text-red-700">*</span>
          </label>
          <input
            id="contact-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={200}
            required
            className="w-full px-3 py-2 rounded-md border border-[#d4d4d2] bg-white text-[14px] focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
            disabled={submitting}
          />
          {errors.subject && <p className="mt-1 text-[12px] text-red-700">{errors.subject}</p>}
        </div>

        <div>
          <label htmlFor="contact-body" className="block text-[13px] font-medium text-[#1a1a1a] mb-1">
            متن پیام <span className="text-red-700">*</span>
          </label>
          <textarea
            id="contact-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={8000}
            required
            rows={6}
            className="w-full px-3 py-2 rounded-md border border-[#d4d4d2] bg-white text-[14px] leading-7 focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
            disabled={submitting}
            placeholder="در صورت گزارش خطا، شناسه قانون (مثلاً law-1387-1342) و شماره ماده را درج کنید."
          />
          {errors.body && <p className="mt-1 text-[12px] text-red-700">{errors.body}</p>}
          <p className="mt-1 text-[11.5px] text-[#6b6b6b]">{body.length.toLocaleString("en-US")} / ۸۰۰۰ نویسه</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="btn-legal btn-legal-sm"
            style={{
              backgroundColor: "#1a1a1a",
              color: "#fff",
              borderColor: "#1a1a1a",
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? "در حال ارسال..." : "ارسال پیام"}
          </button>
          {submitting && <span className="text-[12px] text-[#6b6b6b]">لطفاً صبر کنید...</span>}
        </div>
      </form>
    </>
  );
}
