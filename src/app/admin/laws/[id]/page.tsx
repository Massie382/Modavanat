"use client";

import { useState, useEffect, use, useRef, useCallback } from "react";
import Link from "next/link";
import { PageHead, Card, Badge, Tabs, Field, Switch, Notice, EmptyState, faNum, statusBadgeVariant } from "@/components/admin/primitives";
import { useToast } from "@/hooks/use-toast";
import type { Law, LawStatus, LawType, EffectType } from "@/lib/types";

// Phase 7 — frontend only. The vocabularies below are static enums
// that the law editor's `<select>` elements render against. They are
// inlined here so the editor renders without depending on the old
// mock module. A Phase 7 task will move them into a shared vocabulary
// table (read from the DB) and serve via `/api/admin/vocabularies`.
const lawTypeVocab: { id: LawType; label: string }[] = [
  { id: "قانون عادی", label: "قانون عادی" },
  { id: "قانون اساسی", label: "قانون اساسی" },
  { id: "آیین‌نامه", label: "آیین‌نامه" },
  { id: "بخشنامه", label: "بخشنامه" },
  { id: "مقررات", label: "مقررات" },
];

const lawStatusVocab: { id: LawStatus; label: string }[] = [
  { id: "in-force", label: "لازم‌الاجرا" },
  { id: "amended", label: "اصلاح‌شده" },
  { id: "revoked", label: "منسوخ" },
  { id: "pending", label: "در انتظار" },
];

const effectTypeVocab: { id: EffectType; label: string }[] = [
  { id: "اصلاح", label: "اصلاح" },
  { id: "افزوده", label: "افزوده" },
  { id: "حذف", label: "حذف" },
  { id: "جایگزینی", label: "جایگزینی" },
  { id: "الحاق", label: "الحاق" },
  { id: "توضیح", label: "توضیح" },
  { id: "اجرا", label: "اجرا" },
  { id: "تفویض اختیار", label: "تفویض اختیار" },
];

const referenceDirectionVocab: { id: string; label: string }[] = [
  { id: "cites", label: "ارجاع می‌کند" },
  { id: "cited-by", label: "ارجاع داده شده" },
  { id: "amends", label: "اصلاح می‌کند" },
  { id: "amended-by", label: "اصلاح شده توسط" },
  { id: "related", label: "مرتبط" },
];

const tocTypeVocab: { id: string; label: string }[] = [
  { id: "book", label: "کتاب" },
  { id: "part", label: "بخش" },
  { id: "chapter", label: "فصل" },
  { id: "section", label: "بخش فرعی" },
  { id: "article", label: "ماده" },
  { id: "schedule", label: "پیوست" },
  { id: "note", label: "تبصره" },
];

export default function LawEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { toast } = useToast();
  const { id } = use(params);
  const [law, setLaw] = useState<Law | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/laws/${encodeURIComponent(id)}`, { cache: "no-store" });
        if (res.status === 404) {
          if (!cancelled) setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setLaw(data.law ?? null);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "خطا در بارگذاری قانون");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const [tab, setTab] = useState("identity");

  if (loading) {
    return (
      <>
        <PageHead title="در حال بارگذاری…" subtitle="کمی صبر کنید…" actions={<Link href="/admin/laws" className="admin-btn admin-btn-ghost">← بازگشت</Link>} />
        <EmptyState title="در حال بارگذاری…" />
      </>
    );
  }

  if (notFound) {
    return (
      <>
        <PageHead title="قانون یافت نشد" subtitle={`شناسه: ${id}`} actions={<Link href="/admin/laws" className="admin-btn admin-btn-ghost">← بازگشت</Link>} />
        <EmptyState title="قانون یافت نشد" desc="ممکن است حذف شده باشد یا شناسه اشتباه باشد." />
      </>
    );
  }

  if (error || !law) {
    return (
      <>
        <PageHead title="خطا" subtitle={error ?? "خطای نامشخص"} actions={<Link href="/admin/laws" className="admin-btn admin-btn-ghost">← بازگشت</Link>} />
        <div className="admin-notice admin-notice-warning">{error ?? "خطا در بارگذاری قانون"}</div>
      </>
    );
  }

  const tabs = [
    { id: "identity", label: "مشخصات اصلی" },
    { id: "toc", label: "فهرست مطالب", count: law.toc.length },
    { id: "articles", label: "متن مواد", count: law.articles.length },
    { id: "amendments", label: "اصلاحات", count: law.amendments.length },
    { id: "references", label: "ارجاعات", count: law.references.length },
    { id: "changes", label: "تغییرات معوق", count: law.outstandingChanges.length },
    { id: "pdfs", label: "فایل‌های PDF", count: 0 },
    { id: "settings", label: "تنظیمات نمایش" },
  ];

  return (
    <>
      <PageHead
        title={law.title}
        subtitle={`${law.type} · ${faNum(law.year)} · ${law.subject}`}
        actions={
          <>
            <Link href={`/admin/laws`} className="admin-btn admin-btn-ghost">← بازگشت</Link>
            <button
              className="admin-btn admin-btn-primary"
              onClick={() => toast({ title: "اطلاع", description: "ذخیره تغییرات در فاز ۷ پیاده‌سازی خواهد شد." })}
            >ذخیره تغییرات</button>
          </>
        }
      />

      <div className="admin-row" style={{ marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <Badge variant={statusBadgeVariant(law.status)}>{lawStatusVocab.find((s) => s.id === law.status)?.label}</Badge>
        <span className="admin-muted">شناسه:</span>
        <code className="admin-code" style={{ padding: "2px 8px" }}>{law.id}</code>
        <span className="admin-muted">|</span>
        <span className="admin-muted">شماره: {law.number || "—"}</span>
        <span className="admin-muted">|</span>
        <span className="admin-muted">مرجع: {law.promulgatingAuthority}</span>
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === "identity" && <IdentityTab law={law} />}
      {tab === "toc" && <TocTab law={law} />}
      {tab === "articles" && <ArticlesTab law={law} />}
      {tab === "amendments" && <AmendmentsTab law={law} />}
      {tab === "references" && <ReferencesTab law={law} />}
      {tab === "changes" && <ChangesTab law={law} />}
      {tab === "pdfs" && <PdfsTab lawId={law.id} lawTitle={law.title} />}
      {tab === "settings" && <SettingsTab law={law} />}
    </>
  );
}

/* ════════════════ IDENTITY TAB ════════════════ */
function IdentityTab({ law }: { law: Law }) {
  return (
    <div className="admin-grid-2">
      <Card title="مشخصات هویتی" desc="عنوان، نوع، سال و شناسه قانون">
        <Field label="عنوان کامل" hint="الزامی">
          <input className="admin-input" defaultValue={law.title} />
        </Field>
        <Field label="عنوان کوتاه" hint="اختیاری — برای نمایش در فهرست‌ها">
          <input className="admin-input" defaultValue={law.shortTitle || ""} />
        </Field>
        <div className="admin-grid-2">
          <Field label="نوع قانون">
            <select className="admin-select" defaultValue={law.type}>
              {lawTypeVocab.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="وضعیت">
            <select className="admin-select" defaultValue={law.status}>
              {lawStatusVocab.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </Field>
        </div>
        <div className="admin-grid-2">
          <Field label="سال تصویب (خورشیدی)">
            <input className="admin-input" type="number" defaultValue={law.year} dir="ltr" />
          </Field>
          <Field label="شماره مصوبه">
            <input className="admin-input" defaultValue={law.number || ""} dir="ltr" />
          </Field>
        </div>
        <Field label="قلمرو">
          <input className="admin-input" defaultValue={law.extent} />
        </Field>
        <Field label="موضوع">
          <input className="admin-input" defaultValue={law.subject} />
        </Field>
        <Field label="مرجع تصویب">
          <input className="admin-input" defaultValue={law.promulgatingAuthority} />
        </Field>
      </Card>

      <div className="admin-stack">
        <Card title="تاریخ‌ها" desc="تاریخ‌های رسمی قانون">
          <div className="admin-grid-2">
            <Field label="تاریخ تصویب"><input className="admin-input" defaultValue={law.approvedDate} dir="ltr" /></Field>
            <Field label="تاریخ اجرا"><input className="admin-input" defaultValue={law.effectiveDate} dir="ltr" /></Field>
          </div>
          <div className="admin-grid-2">
            <Field label="آخرین بازنگری"><input className="admin-input" defaultValue={law.lastRevisionDate} dir="ltr" /></Field>
            <Field label="شناسه یکتا (slug)"><input className="admin-input admin-mono" defaultValue={law.id} dir="ltr" /></Field>
          </div>
        </Card>

        <Card title="توضیحات">
          <Field label="شرح کوتاه" hint="نمایش در کارت قانون و فهرست">
            <textarea className="admin-textarea" defaultValue={law.description} rows={3} />
          </Field>
          <Field label="شرح تفصیلی" hint="نمایش در تب فهرست مطالب">
            <textarea className="admin-textarea" defaultValue={law.longDescription || ""} rows={5} />
          </Field>
        </Card>

        {law.originalVersion && (
          <Card title="نسخه اصلی">
            <Field label="تاریخ نسخه اصلی"><input className="admin-input" defaultValue={law.originalVersion.approvedDate} dir="ltr" /></Field>
            <Field label="شرح نسخه اصلی"><textarea className="admin-textarea" defaultValue={law.originalVersion.description} rows={2} /></Field>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ════════════════ TOC TAB ════════════════ */
function TocTab({ law }: { law: Law }) {
  return (
    <Card
      title="ساختار فهرست مطالب"
      desc="درخت سلسله‌مراتبی قانون — کتاب، بخش، فصل، ماده. برای جابجایی، درخت را بکشید."
      actions={<button className="admin-btn admin-btn-sm admin-btn-primary">+ افزودن ردیف</button>}
    >
      <div className="admin-tree">
        {law.toc.map((node) => <TocNode key={node.id} node={node} depth={0} />)}
      </div>
      <Notice variant="info" >
        نوع هر ردیف را از لیست انتخاب کنید. ردیف‌های از نوع «ماده» باید به یک ماده در تب «متن مواد» متصل شوند (شناسه ماده).
      </Notice>
    </Card>
  );
}

function TocNode({ node, depth }: { node: Law["toc"][number]; depth: number }) {
  const [open, setOpen] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  return (
    <div className="admin-tree-node">
      <div className="admin-tree-row">
        <span className="admin-tree-handle">⠿</span>
        {hasChildren ? (
          <button className="admin-tree-toggle" onClick={() => setOpen(!open)}>{open ? "▾" : "▸"}</button>
        ) : (
          <span className="admin-tree-toggle" />
        )}
        <span className="admin-tree-label">
          <strong>{node.label}</strong>
          {node.title && <span className="admin-tree-meta"> — {node.title}</span>}
        </span>
        <Badge variant="neutral">{tocTypeVocab.find((t) => t.id === node.type)?.label || node.type}</Badge>
        {node.articleId && <Badge variant="info">→ {node.articleId}</Badge>}
        <button className="admin-btn admin-btn-sm admin-btn-ghost">ویرایش</button>
        <button className="admin-btn admin-btn-sm admin-btn-ghost">+</button>
        <button className="admin-btn admin-btn-sm admin-btn-ghost">حذف</button>
      </div>
      {hasChildren && open && (
        <div className="admin-tree-children">
          {node.children!.map((c) => <TocNode key={c.id} node={c} depth={depth + 1} />)}
        </div>
      )}
    </div>
  );
}

/* ════════════════ ARTICLES TAB — custom editor ════════════════ */
function ArticlesTab({ law }: { law: Law }) {
  const [selectedId, setSelectedId] = useState(law.articles[0]?.id || "");
  const article = law.articles.find((a) => a.id === selectedId) || law.articles[0];

  return (
    <div className="admin-split">
      {/* Article list */}
      <Card title={`مواد (${faNum(law.articles.length)})`} tight>
        <div style={{ maxHeight: 600, overflowY: "auto" }}>
          {law.articles.map((a) => (
            <button
              key={a.id}
              className={`admin-tree-row ${a.id === selectedId ? "is-selected" : ""}`}
              style={{ width: "100%", background: "none", cursor: "pointer", borderBottom: "1px solid var(--admin-border-soft)", justifyContent: "flex-start" }}
              onClick={() => setSelectedId(a.id)}
            >
              <span className="admin-tree-handle">⠿</span>
              <span style={{ flex: 1, textAlign: "start" }}>
                <strong>{a.number}</strong>
                {a.commentary && a.commentary.length > 0 && (
                  <Badge variant="accent" >{faNum(a.commentary.length)} یادداشت</Badge>
                )}
              </span>
            </button>
          ))}
        </div>
        <div className="admin-card-foot">
          <button className="admin-btn admin-btn-sm admin-btn-primary">+ ماده جدید</button>
        </div>
      </Card>

      {/* Article editor */}
      {article ? (
        <Card title={`ویرایش ${article.number}`} actions={<button className="admin-btn admin-btn-sm admin-btn-danger">حذف ماده</button>}>
          <div className="admin-grid-2">
            <Field label="شماره/عنوان ماده" hint="مثلاً «ماده ۱۰» یا «تبصره ۲»">
              <input className="admin-input" defaultValue={article.number} />
            </Field>
            <Field label="شناسه ماده" hint="یکتا — برای ارجاع از فهرست">
              <input className="admin-input admin-mono" defaultValue={article.id} dir="ltr" />
            </Field>
          </div>
          <Field label="عنوان فرعی ماده" hint="اختیاری">
            <input className="admin-input" defaultValue={article.title || ""} />
          </Field>

          <Field
            label="متن ماده"
            hint="از نشانگرهای [تN]...[تN] برای ارجاع به یادداشت‌های ویرایشی استفاده کنید"
            help="مثال: هر قانونی پس از هفت روز قابل اجراست [ت۱]. این بند الحاق شد [ت۲]."
          >
            <textarea
              className="admin-textarea"
              defaultValue={article.text}
              rows={8}
              style={{ lineHeight: 1.9, fontFamily: "var(--font-vazirmatn)" }}
            />
          </Field>

          <Notice variant="info">
            نشانگرهای F به‌صورت خودکار در سایت به‌صورت بالانویس نمایش داده می‌شوند و به یادداشت‌های ویرایشی متصل می‌شوند.
          </Notice>

          {/* Commentary editor */}
          <div className="admin-row-between" style={{ margin: "1.5rem 0 0.75rem" }}>
            <h3 style={{ margin: 0, fontSize: 13, color: "var(--admin-ink)", fontWeight: 600 }}>یادداشت‌های ویرایشی (Commentary)</h3>
            <button className="admin-btn admin-btn-sm admin-btn-ghost">+ یادداشت</button>
          </div>

          {article.commentary && article.commentary.length > 0 ? (
            <div className="admin-stack-sm">
              {article.commentary.map((c, i) => (
                <div key={i} style={{ border: "1px solid var(--admin-border)", borderRadius: 4, padding: "0.75rem", backgroundColor: "var(--admin-surface-sunken)" }}>
                  <div className="admin-row" style={{ marginBottom: "0.5rem" }}>
                    <Badge variant="accent">نشانگر: {c.marker}</Badge>
                    <Badge variant="neutral">{effectTypeVocab.find((e) => e.id === c.effectType)?.label || c.effectType}</Badge>
                    <span className="admin-muted">تاریخ: {c.date}</span>
                    <div style={{ flex: 1 }} />
                    <button className="admin-btn admin-btn-sm admin-btn-ghost">ویرایش</button>
                    <button className="admin-btn admin-btn-sm admin-btn-ghost">حذف</button>
                  </div>
                  <textarea className="admin-textarea" defaultValue={c.text} rows={2} style={{ backgroundColor: "var(--admin-surface)" }} />
                  <div className="admin-muted" style={{ marginTop: "0.5rem", fontSize: 11 }}>
                    قانون اصلاح‌کننده: {c.affectingLaw.title} ({faNum(c.affectingLaw.year)}) — {c.affectingLaw.provisionLabel}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="یادداشتی ثبت نشده" desc="برای افزودن یادداشت ویرایشی به این ماده، دکمه «+ یادداشت» را بزنید." />
          )}
        </Card>
      ) : (
        <Card><EmptyState title="ماده‌ای انتخاب نشده" desc="یک ماده از فهرست انتخاب کنید یا ماده جدید اضافه کنید." /></Card>
      )}
    </div>
  );
}

/* ════════════════ AMENDMENTS TAB ════════════════ */
function AmendmentsTab({ law }: { law: Law }) {
  return (
    <Card
      title="خط زمانی اصلاحات"
      desc="هر اصلاح شامل نوع اثر، ماده متأثر، قانون اصلاح‌کننده، شرح و متن پیش/پس از اصلاح برای نمایش مقایسه"
      actions={<button className="admin-btn admin-btn-sm admin-btn-primary">+ اصلاح جدید</button>}
    >
      <div className="admin-stack">
        {law.amendments.map((a, i) => (
          <div key={i} style={{ border: "1px solid var(--admin-border)", borderRadius: 6, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.625rem 0.875rem", backgroundColor: "var(--admin-surface-sunken)", borderBottom: "1px solid var(--admin-border)", flexWrap: "wrap" }}>
              <Badge variant="accent">{effectTypeVocab.find((e) => e.id === a.effectType)?.label || a.effectType}</Badge>
              <strong style={{ fontSize: 12.5 }}>{a.affectedProvision}</strong>
              <span className="admin-muted">{a.date} · {a.dateLabel}</span>
              {a.appliedToText ? <Badge variant="success">اعمال‌شده</Badge> : <Badge variant="warning">در انتظار</Badge>}
              <div style={{ flex: 1 }} />
              <button className="admin-btn admin-btn-sm admin-btn-ghost">ویرایش</button>
              <button className="admin-btn admin-btn-sm admin-btn-ghost">حذف</button>
            </div>
            <div style={{ padding: "0.875rem" }}>
              <div className="admin-muted" style={{ marginBottom: "0.5rem", fontSize: 12 }}>
                قانون اصلاح‌کننده: <strong style={{ color: "var(--admin-ink)" }}>{a.affectingLaw.title}</strong> ({faNum(a.affectingLaw.year)}) — {a.affectingLaw.provisionLabel}
              </div>
              <Field label="شرح اصلاح">
                <textarea className="admin-textarea" defaultValue={a.description} rows={2} />
              </Field>
              <div className="admin-grid-2" style={{ marginTop: "0.75rem" }}>
                <Field label="متن پیش از اصلاح" hint="برای نمایش مقایسه">
                  <textarea className="admin-textarea" defaultValue={a.beforeText || ""} rows={4} style={{ direction: "rtl", fontFamily: "var(--font-vazirmatn)" }} />
                </Field>
                <Field label="متن پس از اصلاح" hint="برای نمایش مقایسه">
                  <textarea className="admin-textarea" defaultValue={a.afterText || ""} rows={4} style={{ direction: "rtl", fontFamily: "var(--font-vazirmatn)" }} />
                </Field>
              </div>
              <div className="admin-row" style={{ marginTop: "0.5rem" }}>
                <button className="admin-btn admin-btn-sm admin-btn-ghost">مشاهده پیش‌نمایش مقایسه</button>
                {a.note && <span className="admin-muted">یادداشت: {a.note}</span>}
              </div>
            </div>
          </div>
        ))}
        {law.amendments.length === 0 && <EmptyState title="اصلاحی ثبت نشده" />}
      </div>
    </Card>
  );
}

/* ════════════════ REFERENCES TAB ════════════════ */
function ReferencesTab({ law }: { law: Law }) {
  return (
    <Card
      title="شبکه ارجاعات"
      desc="ارتباط این قانون با سایر قوانین — در ۵ جهت: ارجاع می‌کند، ارجاع داده شده، اصلاح می‌کند، اصلاح شده، مرتبط"
      actions={<button className="admin-btn admin-btn-sm admin-btn-primary">+ ارجاع جدید</button>}
    >
      <div className="admin-stack">
        {law.references.map((r, i) => (
          <div key={i} style={{ border: "1px solid var(--admin-border)", borderRadius: 4, padding: "0.75rem" }}>
            <div className="admin-row" style={{ marginBottom: "0.5rem", flexWrap: "wrap" }}>
              <Badge variant={r.direction === "cites" || r.direction === "amends" ? "info" : r.direction === "amended-by" || r.direction === "cited-by" ? "accent" : "neutral"}>
                {referenceDirectionVocab.find((d) => d.id === r.direction)?.label || r.direction}
              </Badge>
              <strong style={{ fontSize: 12.5 }}>{r.target.title}</strong>
              <span className="admin-muted">({faNum(r.target.year)}) — {r.target.provisionLabel}</span>
              <div style={{ flex: 1 }} />
              <button className="admin-btn admin-btn-sm admin-btn-ghost">ویرایش</button>
              <button className="admin-btn admin-btn-sm admin-btn-ghost">حذف</button>
            </div>
            <Field label="شرح ارجاع"><input className="admin-input" defaultValue={r.context} /></Field>
            <div className="admin-grid-2" style={{ marginTop: "0.5rem" }}>
              <Field label="ماده مبدأ"><input className="admin-input" defaultValue={r.sourceProvision || ""} /></Field>
              <Field label="ماده مقصد"><input className="admin-input" defaultValue={r.targetProvision || ""} /></Field>
            </div>
          </div>
        ))}
        {law.references.length === 0 && <EmptyState title="ارجاعی ثبت نشده" />}
      </div>
    </Card>
  );
}

/* ════════════════ OUTSTANDING CHANGES TAB ════════════════ */
function ChangesTab({ law }: { law: Law }) {
  return (
    <Card
      title="تغییرات معوق"
      desc="تغییراتی که به این قانون اعمال شده‌اند اما هنوز در متن اعمال نشده‌اند"
      actions={<button className="admin-btn admin-btn-sm admin-btn-primary">+ تغییر معوق</button>}
    >
      <div className="admin-stack">
        {law.outstandingChanges.map((c, i) => (
          <div key={i} style={{ border: "1px solid var(--admin-border)", borderRadius: 4, padding: "0.75rem", backgroundColor: "rgba(192, 138, 62, 0.05)" }}>
            <div className="admin-row" style={{ marginBottom: "0.5rem", flexWrap: "wrap" }}>
              <Badge variant="warning">{effectTypeVocab.find((e) => e.id === c.effectType)?.label || c.effectType}</Badge>
              <strong>{c.affectedProvision}</strong>
              <span className="admin-muted">قانون اصلاح‌کننده: {c.affectingLaw.title}</span>
              {c.expectedDate && <span className="admin-muted">تاریخ پیش‌بینی: {c.expectedDate}</span>}
              <div style={{ flex: 1 }} />
              <button className="admin-btn admin-btn-sm admin-btn-ghost">اعمال در متن</button>
              <button className="admin-btn admin-btn-sm admin-btn-ghost">حذف</button>
            </div>
            <input className="admin-input" defaultValue={c.description} />
          </div>
        ))}
        {law.outstandingChanges.length === 0 && <EmptyState title="تغییر معوقی وجود ندارد" desc="همه اصلاحات در متن اعمال شده‌اند." />}
      </div>
    </Card>
  );
}

/* ════════════════ PDFS TAB — multiple uploads ════════════════ */
interface LawPdfRow {
  id: string;
  label: string;
  version: string | null;
  filePath: string;
  fileSize: number | null;
  pageCount: number | null;
  isPrimary: boolean;
  uploadedBy: string | null;
  createdAt: string;
}
function PdfsTab({ lawId, lawTitle }: { lawId: string; lawTitle: string }) {
  const { toast } = useToast();
  const [pdfs, setPdfs] = useState<LawPdfRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newVersion, setNewVersion] = useState("");
  const [newIsPrimary, setNewIsPrimary] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  void lawTitle;

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/laws/${encodeURIComponent(lawId)}/pdfs`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { pdfs: LawPdfRow[] };
      setPdfs(data.pdfs);
    } catch (err) {
      toast({
        title: "خطا",
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setLoading(false);
    }
  }, [lawId, toast]);

  useEffect(() => {
    reload();
  }, [reload]);

  const onUpload = async () => {
    if (!selectedFile) {
      toast({ title: "خطا", description: "ابتدا فایل را انتخاب کنید." });
      return;
    }
    if (!newLabel.trim()) {
      toast({ title: "خطا", description: "برچسب فایل الزامی است." });
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", selectedFile);
      fd.append("label", newLabel.trim());
      if (newVersion.trim()) fd.append("version", newVersion.trim());
      fd.append("isPrimary", newIsPrimary ? "true" : "false");
      const res = await fetch(`/api/admin/laws/${encodeURIComponent(lawId)}/pdfs`, {
        method: "POST",
        body: fd,
        cache: "no-store",
      });
      if (!res.ok) {
        const j = (await res.json()) as { message?: string };
        throw new Error(j.message ?? `HTTP ${res.status}`);
      }
      await reload();
      setSelectedFile(null);
      setNewLabel("");
      setNewVersion("");
      setNewIsPrimary(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast({ title: "آپلود شد", description: "فایل PDF با موفقیت آپلود شد." });
    } catch (err) {
      toast({
        title: "خطا",
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setUploading(false);
    }
  };

  const onSetPrimary = async (pdfId: string) => {
    try {
      const res = await fetch(
        `/api/admin/laws/${encodeURIComponent(lawId)}/pdfs/${encodeURIComponent(pdfId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPrimary: true }),
          cache: "no-store",
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await reload();
      toast({ title: "تنظیم شد", description: "فایل به‌عنوان اصلی نشانه‌گذاری شد." });
    } catch (err) {
      toast({
        title: "خطا",
        description: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const onDelete = async (pdfId: string) => {
    if (!confirm("از حذف این فایل PDF مطمئن هستید؟")) return;
    try {
      const res = await fetch(
        `/api/admin/laws/${encodeURIComponent(lawId)}/pdfs/${encodeURIComponent(pdfId)}`,
        { method: "DELETE", cache: "no-store" }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await reload();
      toast({ title: "حذف شد", description: "فایل حذف شد." });
    } catch (err) {
      toast({
        title: "خطا",
        description: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const formatBytes = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <Card
      title="فایل‌های PDF"
      desc="می‌توانید چند فایل PDF برای هر قانون آپلود کنید — نسخه اصلی، نسخه اصلاح‌شده، خلاصه تغییرات و…"
    >
      {/* Upload form */}
      <div
        style={{
          border: "2px dashed var(--admin-border)",
          borderRadius: 6,
          padding: "1.5rem",
          marginBottom: "1rem",
          backgroundColor: "var(--admin-surface-sunken)",
        }}
      >
        <div className="admin-grid-2">
          <Field label="برچسب فایل" hint="الزامی">
            <input
              className="admin-input"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="مثلاً نسخه اصلی، نسخه اصلاح‌شده"
            />
          </Field>
          <Field label="نسخه (اختیاری)">
            <input
              className="admin-input"
              value={newVersion}
              onChange={(e) => setNewVersion(e.target.value)}
              placeholder="مثلاً 1.0، 1392-08-15"
              dir="ltr"
            />
          </Field>
        </div>
        <div className="admin-row-between" style={{ margin: "0.5rem 0" }}>
          <span style={{ fontSize: 13 }}>تنظیم به‌عنوان فایل اصلی</span>
          <Switch on={newIsPrimary} onChange={setNewIsPrimary} />
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          style={{ marginBottom: "0.75rem" }}
          onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
        />
        <div className="admin-row" style={{ justifyContent: "flex-end" }}>
          <button
            className="admin-btn admin-btn-primary"
            onClick={onUpload}
            disabled={uploading}
          >
            {uploading ? "در حال آپلود…" : "+ آپلود PDF"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="admin-muted" style={{ textAlign: "center", padding: "1rem" }}>
          در حال بارگذاری…
        </div>
      ) : pdfs.length > 0 ? (
        <table className="admin-table">
          <thead>
            <tr>
              <th>عنوان</th>
              <th>نسخه</th>
              <th className="col-num">اندازه</th>
              <th>آپلود توسط</th>
              <th>تاریخ</th>
              <th>اصلی</th>
              <th className="col-narrow">عمل</th>
            </tr>
          </thead>
          <tbody>
            {pdfs.map((p) => (
              <tr key={p.id}>
                <td>
                  <strong>{p.label}</strong>
                  <br />
                  <a
                    href={p.filePath}
                    target="_blank"
                    rel="noreferrer"
                    className="admin-mono admin-muted"
                    dir="ltr"
                    style={{ fontSize: 11 }}
                  >
                    {p.filePath}
                  </a>
                </td>
                <td>{p.version ?? "—"}</td>
                <td className="col-num">{formatBytes(p.fileSize)}</td>
                <td>
                  <code className="admin-mono admin-muted">{p.uploadedBy?.slice(0, 8) ?? "—"}</code>
                </td>
                <td>
                  <span style={{ fontSize: 11 }}>
                    {new Intl.DateTimeFormat("fa-IR").format(new Date(p.createdAt))}
                  </span>
                </td>
                <td className="col-narrow">
                  {p.isPrimary ? (
                    <Badge variant="success">اصلی</Badge>
                  ) : (
                    <button
                      className="admin-btn admin-btn-sm admin-btn-ghost"
                      onClick={() => onSetPrimary(p.id)}
                    >
                      تنظیم اصلی
                    </button>
                  )}
                </td>
                <td className="col-narrow">
                  <a
                    href={p.filePath}
                    target="_blank"
                    rel="noreferrer"
                    className="admin-btn admin-btn-sm admin-btn-ghost"
                  >
                    دانلود
                  </a>
                  <button
                    className="admin-btn admin-btn-sm admin-btn-ghost"
                    onClick={() => onDelete(p.id)}
                  >
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <EmptyState title="فایلی آپلود نشده" desc="برای این قانون هنوز فایل PDF ثبت نشده است." />
      )}

      <Notice variant="info">
        یک فایل را به‌عنوان «اصلی» نشانه‌گذاری کنید تا در دکمه «دانلود PDF» صفحه قانون نمایش داده شود. سایر فایل‌ها در تب «منابع بیشتر» در دسترس خواهند بود.
      </Notice>
    </Card>
  );
}

/* ════════════════ DISPLAY SETTINGS TAB ════════════════ */
function SettingsTab({ law }: { law: Law }) {
  void law;
  const [showOutstanding, setShowOutstanding] = useState(true);
  const [showBreadcrumb, setShowBreadcrumb] = useState(true);
  const [showVersionToggle, setShowVersionToggle] = useState(!!law.originalVersion);
  const [showNetwork, setShowNetwork] = useState(true);

  return (
    <div className="admin-stack">
      <Card title="نمایش در صفحه قانون">
        <div className="admin-row-between" style={{ padding: "0.5rem 0" }}>
          <div>
            <div style={{ fontSize: 13, color: "var(--admin-ink)" }}>نمایش هشدار تغییرات معوق</div>
            <div className="admin-muted">اگر تغییر معوق وجود دارد، هشدار زرد بالای صفحه نمایش داده شود</div>
          </div>
          <Switch on={showOutstanding} onChange={setShowOutstanding} />
        </div>
        <div className="admin-row-between" style={{ padding: "0.5rem 0" }}>
          <div>
            <div style={{ fontSize: 13, color: "var(--admin-ink)" }}>نمایش مسیر navigation (Breadcrumb)</div>
            <div className="admin-muted">نشان دادن مسیر خانه / قوانین / قانون فعلی</div>
          </div>
          <Switch on={showBreadcrumb} onChange={setShowBreadcrumb} />
        </div>
        <div className="admin-row-between" style={{ padding: "0.5rem 0" }}>
          <div>
            <div style={{ fontSize: 13, color: "var(--admin-ink)" }}>نمایش تغییر نسخه (اصلی / اصلاح‌شده)</div>
            <div className="admin-muted">امکان تغییر بین نسخه اصلی و اصلاح‌شده</div>
          </div>
          <Switch on={showVersionToggle} onChange={setShowVersionToggle} />
        </div>
        <div className="admin-row-between" style={{ padding: "0.5rem 0" }}>
          <div>
            <div style={{ fontSize: 13, color: "var(--admin-ink)" }}>نمایش نمودار شبکه ارجاعات</div>
            <div className="admin-muted">نمودار SVG شبکه ارجاعات در تب ارجاعات</div>
          </div>
          <Switch on={showNetwork} onChange={setShowNetwork} />
        </div>
      </Card>

      <Card title="دکمه‌های کاربردی">
        <Field label="دکمه چاپ"><Switch on={true} onChange={() => {}} label="فعال" /></Field>
        <Field label="دکمه دانلود PDF"><Switch on={true} onChange={() => {}} label="فعال" /></Field>
        <Field label="دکمه اشتراک RSS"><Switch on={true} onChange={() => {}} label="فعال" /></Field>
      </Card>

      <Card title="قالب ارجاع‌دهی" desc="الگوی متن ارجاع در پایین صفحه قانون">
        <Field label="قالب" help="متغیرها: {title}, {approvedDate}, {promulgatingAuthority}, {siteName}">
          <textarea className="admin-textarea" defaultValue="{title} — مصوب {approvedDate} — مرجع: {promulgatingAuthority} — {siteName}" rows={2} />
        </Field>
      </Card>
    </div>
  );
}
