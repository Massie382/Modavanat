"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHead, Card, Badge, Field, Switch, EmptyState, faNum } from "@/components/admin/primitives";
import { defaultStaticPages } from "@/lib/admin-data";

export default function PagesManager() {
  const [selected, setSelected] = useState(defaultStaticPages[0].id);
  const page = defaultStaticPages.find((p) => p.id === selected) || defaultStaticPages[0];

  return (
    <>
      <PageHead
        title="مدیریت صفحات ایستا"
        subtitle="ویرایش محتوای صفحات اطلاعاتی سایت"
        actions={<button className="admin-btn admin-btn-primary">+ صفحه جدید</button>}
      />

      <div className="admin-split">
        <Card title="صفحات" tight>
          {defaultStaticPages.map((p) => (
            <button
              key={p.id}
              className={`admin-tree-row ${p.id === selected ? "is-selected" : ""}`}
              style={{ width: "100%", background: "none", cursor: "pointer", borderBottom: "1px solid var(--admin-border-soft)", justifyContent: "flex-start" }}
              onClick={() => setSelected(p.id)}
            >
              <span style={{ flex: 1, textAlign: "start" }}>
                <strong style={{ display: "block", fontSize: 12.5 }}>{p.title}</strong>
                <span className="admin-muted admin-mono">/{p.slug}</span>
              </span>
              {p.visible ? <Badge variant="success">عمومی</Badge> : <Badge variant="neutral">پنهان</Badge>}
            </button>
          ))}
        </Card>

        <div className="admin-stack">
          <Card title="مشخصات صفحه">
            <div className="admin-grid-2">
              <Field label="عنوان صفحه"><input className="admin-input" defaultValue={page.title} /></Field>
              <Field label="عنوان کوتاه (eyebrow)"><input className="admin-input" defaultValue={page.eyebrow} /></Field>
            </div>
            <Field label="زیرعنوان"><input className="admin-input" defaultValue={page.subtitle} /></Field>
            <div className="admin-grid-3">
              <Field label="آدرس (slug)"><input className="admin-input admin-mono" defaultValue={page.slug} dir="ltr" /></Field>
              <Field label="آخرین به‌روزرسانی"><input className="admin-input" defaultValue={page.lastUpdated} dir="ltr" /></Field>
              <Field label="نسخه"><input className="admin-input" defaultValue={page.version} /></Field>
            </div>
            <div className="admin-row-between" style={{ marginTop: "0.5rem" }}>
              <span style={{ fontSize: 13, color: "var(--admin-ink)" }}>نمایش عمومی صفحه</span>
              <Switch on={page.visible} onChange={() => {}} />
            </div>
            <div className="admin-row" style={{ marginTop: "0.5rem" }}>
              <Link href={`/${page.slug}`} target="_blank" className="admin-btn admin-btn-sm admin-btn-ghost">مشاهده صفحه ←</Link>
            </div>
          </Card>

          <Card
            title="بخش‌های محتوا"
            desc={`${faNum(page.sections.length)} بخش`}
            actions={<button className="admin-btn admin-btn-sm admin-btn-primary">+ بخش جدید</button>}
          >
            <div className="admin-stack">
              {page.sections.map((s, i) => (
                <div key={s.id} style={{ border: "1px solid var(--admin-border)", borderRadius: 4, padding: "0.75rem" }}>
                  <div className="admin-row" style={{ marginBottom: "0.5rem" }}>
                    <Badge variant="neutral">بخش {faNum(i + 1)}</Badge>
                    <div style={{ flex: 1 }} />
                    <Switch on={s.visible} onChange={() => {}} />
                    <button className="admin-btn admin-btn-sm admin-btn-ghost">↑</button>
                    <button className="admin-btn admin-btn-sm admin-btn-ghost">↓</button>
                    <button className="admin-btn admin-btn-sm admin-btn-ghost">حذف</button>
                  </div>
                  <Field label="عنوان بخش (H2)"><input className="admin-input" defaultValue={s.heading} /></Field>
                  <Field label="متن بخش" hint="پشتیبانی از Markdown">
                    <textarea className="admin-textarea" defaultValue={s.body} rows={4} />
                  </Field>
                </div>
              ))}
              {page.sections.length === 0 && <EmptyState title="بخشی وجود ندارد" />}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
