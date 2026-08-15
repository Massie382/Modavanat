"use client";

import { useState } from "react";
import { PageHead, Card, Tabs, Badge, Field, Switch } from "@/components/admin/primitives";
import { useToast } from "@/hooks/use-toast";
import { lawStatusVocab, lawTypeVocab, effectTypeVocab, referenceDirectionVocab, tocTypeVocab, type VocabEntry } from "@/lib/admin-data";
import { faNum } from "@/components/admin/primitives";

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

      <Tabs
        tabs={Object.entries(VOCABS).map(([id, v]) => ({ id, label: v.label, count: v.entries.length }))}
        active={tab}
        onChange={setTab}
      />

      <Card
        title={vocab.label}
        desc={`${faNum(vocab.entries.length)} مورد — برای افزودن، دکمه زیر را بزنید`}
        actions={<button className="admin-btn admin-btn-sm admin-btn-primary" onClick={() => toast({ title: "ایجاد", description: "باز کردن فرم ایجاد..." })}>+ مورد جدید</button>}
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
                  <button className="admin-btn admin-btn-sm admin-btn-ghost" onClick={() => toast({ title: "ویرایش", description: "باز کردن فرم ویرایش..." })}>ویرایش</button>
                  <button className="admin-btn admin-btn-sm admin-btn-ghost" onClick={() => toast({ title: "حذف", description: "آیتم حذف شد.", variant: "destructive" })}>حذف</button>
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
