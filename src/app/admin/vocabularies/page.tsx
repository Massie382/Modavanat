"use client";

import { useState } from "react";
import { PageHead, Card, Tabs, Field, Switch, Notice } from "@/components/admin/primitives";
import { useToast } from "@/hooks/use-toast";
import { faNum } from "@/components/admin/primitives";

// Phase 7 — frontend only. The vocabularies below are static enums
// that should eventually come from a vocabulary table in the DB. For
// Phase E we inline them so the page renders without depending on
// the old mock module.

interface VocabEntry {
  id: string;
  label: string;
  englishLabel?: string;
  description?: string;
  active: boolean;
}

const lawStatusVocab: VocabEntry[] = [
  { id: "in-force", label: "لازم‌الاجرا", englishLabel: "in-force", active: true },
  { id: "amended", label: "اصلاح‌شده", englishLabel: "amended", active: true },
  { id: "revoked", label: "منسوخ", englishLabel: "revoked", active: true },
  { id: "pending", label: "در انتظار", englishLabel: "pending", active: true },
];

const lawTypeVocab: VocabEntry[] = [
  { id: "قانون عادی", label: "قانون عادی", active: true },
  { id: "قانون اساسی", label: "قانون اساسی", active: true },
  { id: "آیین‌نامه", label: "آیین‌نامه", active: true },
  { id: "بخشنامه", label: "بخشنامه", active: true },
  { id: "مقررات", label: "مقررات", active: true },
];

const effectTypeVocab: VocabEntry[] = [
  { id: "اصلاح", label: "اصلاح", description: "تغییر عبارت یا کلمات در متن ماده", active: true },
  { id: "افزوده", label: "افزوده", description: "افزودن بند یا تبصره جدید", active: true },
  { id: "حذف", label: "حذف", description: "حذف بخشی از ماده یا کل ماده", active: true },
  { id: "جایگزینی", label: "جایگزینی", description: "جایگزینی کامل یک ماده با متن جدید", active: true },
  { id: "الحاق", label: "الحاق", description: "افزودن ماده یا بند جدید به قانون", active: true },
  { id: "توضیح", label: "توضیح", description: "توضیح تکمیلی درباره متن ماده", active: true },
  { id: "اجرا", label: "اجرا", description: "تاریخ اجرا یا لازم‌الاجرا شدن", active: true },
  { id: "تفویض اختیار", label: "تفویض اختیار", description: "واگذاری اختیار به مرجع دیگر", active: true },
];

const referenceDirectionVocab: VocabEntry[] = [
  { id: "cites", label: "ارجاع می‌کند", englishLabel: "cites", active: true },
  { id: "cited-by", label: "ارجاع داده شده", englishLabel: "cited-by", active: true },
  { id: "amends", label: "اصلاح می‌کند", englishLabel: "amends", active: true },
  { id: "amended-by", label: "اصلاح شده توسط", englishLabel: "amended-by", active: true },
  { id: "related", label: "مرتبط", englishLabel: "related", active: true },
];

const tocTypeVocab: VocabEntry[] = [
  { id: "book", label: "کتاب", englishLabel: "book", active: true },
  { id: "part", label: "بخش", englishLabel: "part", active: true },
  { id: "chapter", label: "فصل", englishLabel: "chapter", active: true },
  { id: "section", label: "بخش فرعی", englishLabel: "section", active: true },
  { id: "article", label: "ماده", englishLabel: "article", active: true },
  { id: "schedule", label: "پیوست", englishLabel: "schedule", active: true },
  { id: "note", label: "تبصره", englishLabel: "note", active: true },
];

const VOCABS: Record<string, { label: string; entries: VocabEntry[]; englishLabel?: boolean }> = {
  status: { label: "وضعیت قانون", entries: lawStatusVocab, englishLabel: true },
  type: { label: "نوع قانون", entries: lawTypeVocab },
  effect: { label: "نوع اثر اصلاح", entries: effectTypeVocab },
  direction: { label: "جهت ارجاع", entries: referenceDirectionVocab, englishLabel: true },
  toc: { label: "نوع ردیف فهرست", entries: tocTypeVocab, englishLabel: true },
};

export default function VocabulariesPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState("status");
  const vocab = VOCABS[tab];

  return (
    <>
      <PageHead
        title="مدیریت واژگان"
        subtitle="واژگان کنترل‌شده برای طبقه‌بندی قوانین، اصلاحات و ارجاعات"
      />

      <Notice variant="warning">
        Phase 7 — frontend only. این واژگان در فاز ۷ به یک جدول پایگاه‌داده منتقل می‌شوند.
      </Notice>

      <Tabs
        tabs={Object.entries(VOCABS).map(([id, v]) => ({ id, label: v.label, count: v.entries.length }))}
        active={tab}
        onChange={setTab}
      />

      <Card
        title={vocab.label}
        desc={`${faNum(vocab.entries.length)} مورد — برای افزودن، دکمه زیر را بزنید`}
        actions={<button className="admin-btn admin-btn-sm admin-btn-primary" onClick={() => toast({ title: "اطلاع", description: "ایجاد واژه جدید در فاز ۷ پیاده‌سازی خواهد شد." })}>+ مورد جدید</button>}
      >
        <table className="admin-table">
          <thead>
            <tr>
              <th>برچسب فارسی</th>
              {vocab.englishLabel && <th>برچسب انگلیسی</th>}
              <th>توضیحات</th>
              <th>شناسه</th>
              <th className="col-narrow">فعال</th>
              <th className="col-narrow">عمل</th>
            </tr>
          </thead>
          <tbody>
            {vocab.entries.map((e) => (
              <tr key={e.id}>
                <td><strong>{e.label}</strong></td>
                {vocab.englishLabel && <td><code className="admin-mono" style={{ color: "var(--admin-ink-muted)" }}>{e.englishLabel || "—"}</code></td>}
                <td><span className="admin-muted">{e.description || "—"}</span></td>
                <td><code className="admin-mono" style={{ color: "var(--admin-ink-muted)" }}>{e.id}</code></td>
                <td className="col-narrow">
                  <Switch on={e.active} onChange={() => {}} />
                </td>
                <td className="col-narrow">
                  <button className="admin-btn admin-btn-sm admin-btn-ghost" onClick={() => toast({ title: "اطلاع", description: "ویرایش در فاز ۷." })}>ویرایش</button>
                  <button className="admin-btn admin-btn-sm admin-btn-ghost" onClick={() => toast({ title: "اطلاع", description: "حذف در فاز ۷.", variant: "destructive" })}>حذف</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="admin-notice admin-notice-warning" style={{ marginTop: "1rem" }}>
        تغییر یا حذف موارد استفاده‌شده در قوانین موجود ممکن است باعث ناسازگاری شود. پیش از حذف، موارد استفاده را بررسی کنید.
      </div>
    </>
  );
}
