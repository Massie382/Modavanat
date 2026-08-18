"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHead, Card, Field, Notice, faNum } from "@/components/admin/primitives";
import { useToast } from "@/hooks/use-toast";

// Phase 7 — frontend only. The vocab below is the static vocabulary used
// by the new-law form's `<select>` elements. It is intentionally inlined
// here so the form renders without depending on the old mock module.
// A Phase 7 task will wire this to `/api/admin/vocabularies` (a
// read-only endpoint backed by the laws table's distinct values + a
// static enum table).
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
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");

  const autoSlug = (t: string) => {
    setSlug(t.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "").slice(0, 60) || "");
  };

  return (
    <>
      <PageHead
        title="افزودن قانون جدید"
        subtitle="مشخصات اولیه قانون را وارد کنید. پس از ذخیره، می‌توانید مواد، اصلاحات و ارجاعات را اضافه کنید."
        actions={<Link href="/admin/laws" className="admin-btn admin-btn-ghost">← بازگشت</Link>}
      />

      <Notice variant="info">
        برای جلوگیری از قانون تکراری، پیش از افزودن، در پایگاه جستجو کنید. شناسه قانون پس از ذخیره قابل تغییر نیست.
      </Notice>

      <Notice variant="warning">
        ذخیره قانون جدید هنوز در فاز ۷ پیاده‌سازی نشده است. این فرم اکنون فقط پیش‌نمایش است.
      </Notice>

      <div className="admin-grid-2">
        <Card title="مشخصات اصلی">
          <Field label="عنوان کامل قانون" hint="الزامی">
            <input className="admin-input" value={title} onChange={(e) => { setTitle(e.target.value); autoSlug(e.target.value); }} placeholder="مثلاً قانون حمایت مصرف‌کننده" />
          </Field>
          <Field label="عنوان کوتاه" hint="اختیاری">
            <input className="admin-input" placeholder="مثلاً قانون مصرف‌کننده" />
          </Field>
          <Field label="شناسه یکتا (slug)" hint="لاتین، بدون فاصله" help="از این شناسه در URL استفاده می‌شود: /law/{slug}">
            <input className="admin-input admin-mono" value={slug} onChange={(e) => setSlug(e.target.value)} dir="ltr" placeholder="q-masraf-1386" />
          </Field>
          <div className="admin-grid-2">
            <Field label="نوع قانون">
              <select className="admin-select">{lawTypeVocab.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select>
            </Field>
            <Field label="وضعیت اولیه">
              <select className="admin-select">{lawStatusVocab.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
            </Field>
          </div>
          <div className="admin-grid-2">
            <Field label="سال تصویب"><input className="admin-input" type="number" placeholder={faNum(1404)} dir="ltr" /></Field>
            <Field label="شماره مصوبه"><input className="admin-input" dir="ltr" /></Field>
          </div>
        </Card>

        <div className="admin-stack">
          <Card title="طبقه‌بندی">
            <div className="admin-grid-2">
              <Field label="قلمرو"><input className="admin-input" defaultValue="کشوری" /></Field>
              <Field label="موضوع"><input className="admin-input" placeholder="مثلاً مدنی، کیفری، تجاری" /></Field>
            </div>
            <Field label="مرجع تصویب"><input className="admin-input" defaultValue="مجلس شورای اسلامی" /></Field>
          </Card>

          <Card title="تاریخ‌ها">
            <div className="admin-grid-2">
              <Field label="تاریخ تصویب"><input className="admin-input" dir="ltr" placeholder="۱۴۰۴/۰۵/۰۶" /></Field>
              <Field label="تاریخ اجرا"><input className="admin-input" dir="ltr" placeholder="۱۴۰۴/۰۵/۰۶" /></Field>
            </div>
          </Card>

          <Card title="شرح">
            <Field label="شرح کوتاه"><textarea className="admin-textarea" rows={3} /></Field>
          </Card>
        </div>
      </div>

      <div className="admin-row" style={{ justifyContent: "flex-end", marginTop: "1rem" }}>
        <Link href="/admin/laws" className="admin-btn admin-btn-ghost">انصراف</Link>
        <button
          className="admin-btn admin-btn-primary"
          onClick={() => toast({ title: "اطلاع", description: "ذخیره قانون جدید در فاز ۷ پیاده‌سازی خواهد شد." })}
        >ذخیره و ادامه ویرایش</button>
      </div>
    </>
  );
}
