"use client";

import { useState, use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHead, Card, Badge, Tabs, Field, Switch, Segmented, Notice, EmptyState, faNum, statusBadgeVariant } from "@/components/admin/primitives";
import {
  getLawByIdForAdmin,
  getAdminLawList,
  defaultLawPdfs,
  lawTypeVocab,
  lawStatusVocab,
  effectTypeVocab,
  referenceDirectionVocab,
  tocTypeVocab,
  getAllReferencedLawTitles,
  type LawPdf,
} from "@/lib/admin-data";

export default function LawEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const law = getLawByIdForAdmin(id);
  if (!law) notFound();

  const [tab, setTab] = useState("identity");

  const tabs = [
    { id: "identity", label: "مشخصات اصلی" },
    { id: "toc", label: "فهرست مطالب", count: law.toc.length },
    { id: "articles", label: "متن مواد", count: law.articles.length },
    { id: "amendments", label: "اصلاحات", count: law.amendments.length },
    { id: "references", label: "ارجاعات", count: law.references.length },
    { id: "changes", label: "تغییرات معوق", count: law.outstandingChanges.length },
    { id: "pdfs", label: "فایل‌های PDF", count: defaultLawPdfs.filter((p) => p.lawId === id).length },
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
            <button className="admin-btn admin-btn-primary">ذخیره تغییرات</button>
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
function IdentityTab({ law }: { law: NonNullable<ReturnType<typeof getLawByIdForAdmin>> }) {
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
function TocTab({ law }: { law: NonNullable<ReturnType<typeof getLawByIdForAdmin>> }) {
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

function TocNode({ node, depth }: { node: any; depth: number }) {
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
          {node.children.map((c: any) => <TocNode key={c.id} node={c} depth={depth + 1} />)}
        </div>
      )}
    </div>
  );
}

/* ════════════════ ARTICLES TAB — custom editor ════════════════ */
function ArticlesTab({ law }: { law: NonNullable<ReturnType<typeof getLawByIdForAdmin>> }) {
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
function AmendmentsTab({ law }: { law: NonNullable<ReturnType<typeof getLawByIdForAdmin>> }) {
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
function ReferencesTab({ law }: { law: NonNullable<ReturnType<typeof getLawByIdForAdmin>> }) {
  const referencedLaws = getAllReferencedLawTitles();
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

        <Notice variant="info">
          قوانین موجود در پایگاه برای انتخاب: {Object.values(referencedLaws).slice(0, 8).map((l) => l.title).join("، ")}…
        </Notice>
      </div>
    </Card>
  );
}

/* ════════════════ OUTSTANDING CHANGES TAB ════════════════ */
function ChangesTab({ law }: { law: NonNullable<ReturnType<typeof getLawByIdForAdmin>> }) {
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
function PdfsTab({ lawId, lawTitle }: { lawId: string; lawTitle: string }) {
  const pdfs: LawPdf[] = defaultLawPdfs.filter((p) => p.lawId === lawId);
  return (
    <Card
      title="فایل‌های PDF"
      desc="می‌توانید چند فایل PDF برای هر قانون آپلود کنید — نسخه اصلی، نسخه اصلاح‌شده، خلاصه تغییرات و…"
      actions={<button className="admin-btn admin-btn-sm admin-btn-primary">+ آپلود PDF</button>}
    >
      {/* Upload dropzone */}
      <div
        style={{
          border: "2px dashed var(--admin-border)",
          borderRadius: 6,
          padding: "2rem",
          textAlign: "center",
          marginBottom: "1rem",
          backgroundColor: "var(--admin-surface-sunken)",
          cursor: "pointer",
        }}
      >
        <div style={{ color: "var(--admin-ink-muted)", marginBottom: "0.5rem" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 0.5rem", display: "block" }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <div style={{ fontSize: 13, color: "var(--admin-ink-soft)" }}>فایل PDF را اینجا بکشید یا کلیک کنید</div>
          <div style={{ fontSize: 11, marginTop: "0.25rem" }}>حداکثر اندازه: ۲۰ مگابایت · فقط PDF</div>
        </div>
      </div>

      {pdfs.length > 0 ? (
        <table className="admin-table">
          <thead>
            <tr>
              <th>عنوان</th><th>نسخه</th><th className="col-num">اندازه</th><th className="col-num">صفحات</th>
              <th>آپلود توسط</th><th>تاریخ</th><th>اصلی</th><th className="col-narrow">عمل</th>
            </tr>
          </thead>
          <tbody>
            {pdfs.map((p) => (
              <tr key={p.id}>
                <td><strong>{p.title}</strong><div className="admin-muted admin-mono">{p.filename}</div></td>
                <td><Badge variant="neutral">{p.version}</Badge></td>
                <td className="col-num">{faNum((p.sizeKb / 1024).toFixed(2))} MB</td>
                <td className="col-num">{faNum(p.pages)}</td>
                <td><span className="admin-muted">{p.uploadedBy}</span></td>
                <td><span className="admin-muted">{p.uploadedAt}</span></td>
                <td>{p.isPrimary ? <Badge variant="accent">اصلی</Badge> : <span className="admin-muted">—</span>}</td>
                <td className="col-narrow">
                  <button className="admin-btn admin-btn-sm admin-btn-ghost">دانلود</button>
                  <button className="admin-btn admin-btn-sm admin-btn-ghost">حذف</button>
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
function SettingsTab({ law }: { law: NonNullable<ReturnType<typeof getLawByIdForAdmin>> }) {
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
