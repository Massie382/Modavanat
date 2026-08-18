"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHead, Card, Field, Notice, faNum } from "@/components/admin/primitives";
import { useToast } from "@/hooks/use-toast";

// Phase 7 — wired to POST /api/admin/laws. On success, redirects to
// /admin/laws/[id] where the admin can continue editing TOC, articles,
// amendments, references, and PDFs.

const lawTypeVocab = [
  { id: "قانون عادی", label: "قانون عادی" },
  { id: "قانون اساسی", label: "قانون اساسی" },
  { id: "آیین‌نامه", label: "آیین‌نامه" },
  { id: "بخشنامه", label: "بخشنامه" },
  { id: "مقررات", label: "مقررات" },
];

const lawStatusVocab = [
  { id: "in-force", label: "لازم‌الاجرا" },
  { id: "amended", label: "اصلاح‌شده" },
  { id: "revoked", label: "منسوخ" },
  { id: "pending", label: "در انتظار" },
];

export default function NewLawPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [shortTitle, setShortTitle] = useState("");
  const [type, setType] = useState<(typeof lawTypeVocab)[number]["id"]>("قانون عادی");
  const [status, setStatus] = useState<(typeof lawStatusVocab)[number]["id"]>("in-force");
  const [year, setYear] = useState<number>(1404);
  const [number, setNumber] = useState("");
  const [extent, setExtent] = useState("کشوری");
  const [subject, setSubject] = useState("");
  const [promulgatingAuthority, setPromulgatingAuthority] = useState("مجلس شورای اسلامی");
  const [approvedDate, setApprovedDate] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [lastRevisionDate, setLastRevisionDate] = useState("");
  const [description, setDescription] = useState("");
  const [longDescription, setLongDescription] = useState("");

  const autoSlug = (t: string) => {
    setSlug(
      t
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]/g, "")
        .slice(0, 60) || ""
    );
  };

  const onSubmit = async () => {
    if (!title || !slug || !subject || !approvedDate || !effectiveDate || !lastRevisionDate || !description) {
      toast({ title: "خطا", description: "همه فیلدهای الزامی را پر کنید." });
      return;
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      toast({ title: "خطا", description: "slug باید kebab-case لاتین باشد." });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/laws", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: slug,
          title,
          shortTitle: shortTitle || undefined,
          type,
          year,
          number: number || undefined,
          status,
          extent,
          subject,
          promulgatingAuthority,
          approvedDate,
          effectiveDate,
          lastRevisionDate,
          description,
          longDescription: longDescription || undefined,
        }),
        cache: "no-store",
      });
      if (!res.ok) {
        const j = (await res.json()) as { message?: string };
        throw new Error(j.message ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { law: { id: string } };
      toast({
        title: "ایجاد شد",
        description: `قانون با شناسه ${data.law.id} ایجاد شد.`,
      });
      router.push(`/admin/laws/${data.law.id}`);
    } catch (err) {
      toast({
        title: "خطا",
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHead
        title="افزودن قانون جدید"
        subtitle="مشخصات اولیه قانون را وارد کنید. پس از ذخیره، می‌توانید مواد، اصلاحات و ارجاعات را اضافه کنید."
        actions={
          <Link href="/admin/laws" className="admin-btn admin-btn-ghost">
            ← بازگشت
          </Link>
        }
      />

      <Notice variant="info">
        برای جلوگیری از قانون تکراری، پیش از افزودن، در پایگاه جستجو کنید. شناسه قانون پس از ذخیره قابل تغییر نیست.
      </Notice>

      <div className="admin-grid-2">
        <Card title="مشخصات اصلی">
          <Field label="عنوان کامل قانون" hint="الزامی">
            <input
              className="admin-input"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                autoSlug(e.target.value);
              }}
              placeholder="مثلاً قانون حمایت مصرف‌کننده"
            />
          </Field>
          <Field label="عنوان کوتاه" hint="اختیاری">
            <input
              className="admin-input"
              value={shortTitle}
              onChange={(e) => setShortTitle(e.target.value)}
              placeholder="مثلاً قانون مصرف‌کننده"
            />
          </Field>
          <Field
            label="شناسه یکتا (slug)"
            hint="لاتین، بدون فاصله"
            help={`از این شناسه در URL استفاده می‌شود: /law/${slug || "..."}`}
          >
            <input
              className="admin-input admin-mono"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              dir="ltr"
              placeholder="q-masraf-1386"
            />
          </Field>
          <div className="admin-grid-2">
            <Field label="نوع قانون">
              <select
                className="admin-select"
                value={type}
                onChange={(e) => setType(e.target.value as typeof type)}
              >
                {lawTypeVocab.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="وضعیت اولیه">
              <select
                className="admin-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
              >
                {lawStatusVocab.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="admin-grid-2">
            <Field label="سال تصویب">
              <input
                className="admin-input"
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value) || 0)}
                dir="ltr"
              />
            </Field>
            <Field label="شماره مصوبه">
              <input
                className="admin-input"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                dir="ltr"
              />
            </Field>
          </div>
        </Card>

        <div className="admin-stack">
          <Card title="طبقه‌بندی">
            <div className="admin-grid-2">
              <Field label="قلمرو">
                <input
                  className="admin-input"
                  value={extent}
                  onChange={(e) => setExtent(e.target.value)}
                />
              </Field>
              <Field label="موضوع" hint="الزامی">
                <input
                  className="admin-input"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="مثلاً مدنی، کیفری، تجاری"
                />
              </Field>
            </div>
            <Field label="مرجع تصویب">
              <input
                className="admin-input"
                value={promulgatingAuthority}
                onChange={(e) => setPromulgatingAuthority(e.target.value)}
              />
            </Field>
          </Card>

          <Card title="تاریخ‌ها">
            <div className="admin-grid-2">
              <Field label="تاریخ تصویب" hint="الزامی">
                <input
                  className="admin-input"
                  dir="ltr"
                  value={approvedDate}
                  onChange={(e) => setApprovedDate(e.target.value)}
                  placeholder="۱۴۰۴/۰۵/۰۶"
                />
              </Field>
              <Field label="تاریخ اجرا" hint="الزامی">
                <input
                  className="admin-input"
                  dir="ltr"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  placeholder="۱۴۰۴/۰۵/۰۶"
                />
              </Field>
            </div>
            <Field label="آخرین بازنگری" hint="الزامی">
              <input
                className="admin-input"
                dir="ltr"
                value={lastRevisionDate}
                onChange={(e) => setLastRevisionDate(e.target.value)}
                placeholder="۱۴۰۴/۰۵/۰۶"
              />
            </Field>
          </Card>

          <Card title="شرح">
            <Field label="شرح کوتاه" hint="الزامی">
              <textarea
                className="admin-textarea"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>
            <Field label="شرح طولانی (اختیاری)">
              <textarea
                className="admin-textarea"
                rows={4}
                value={longDescription}
                onChange={(e) => setLongDescription(e.target.value)}
              />
            </Field>
          </Card>
        </div>
      </div>

      <div className="admin-row" style={{ justifyContent: "flex-end", marginTop: "1rem" }}>
        <Link href="/admin/laws" className="admin-btn admin-btn-ghost">
          انصراف
        </Link>
        <button
          className="admin-btn admin-btn-primary"
          onClick={onSubmit}
          disabled={saving}
        >
          {saving ? "در حال ذخیره…" : "ذخیره و ادامه ویرایش"}
        </button>
      </div>

      <div className="admin-muted" style={{ textAlign: "center", padding: "0.5rem" }}>
        سال جاری: {faNum(1404)}
      </div>
    </>
  );
}
