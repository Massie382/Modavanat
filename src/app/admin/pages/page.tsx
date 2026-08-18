"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHead, Card, Badge, Field, Switch, EmptyState, Notice, faNum } from "@/components/admin/primitives";
import { useToast } from "@/hooks/use-toast";

// Phase 7 — wired to /api/admin/pages. Each page row is stored as a
// JSONB sections array (heading + body markdown + visible).

interface StaticPageSection {
  id: string;
  heading: string;
  body: string;
  visible: boolean;
}
interface StaticPage {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  eyebrow: string;
  version: string;
  visible: boolean;
  sections: StaticPageSection[];
  updatedAt: string; // ISO
}

export default function PagesManager() {
  const { toast } = useToast();
  const [pages, setPages] = useState<StaticPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [creatingNew, setCreatingNew] = useState(false);
  const [newSlug, setNewSlug] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/pages", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { pages: StaticPage[] };
        if (cancelled) return;
        setPages(data.pages);
        if (data.pages.length > 0 && !selected) {
          setSelected(data.pages[0].id);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const page = pages.find((p) => p.id === selected) || pages[0];

  const createPage = async () => {
    if (!newSlug.trim() || !/^[a-z0-9-]+$/.test(newSlug.toLowerCase().trim())) {
      toast({ title: "خطا", description: "slug باید kebab-case لاتین باشد." });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: newSlug.trim(),
          title: "صفحه جدید",
          eyebrow: "",
          subtitle: "",
          sections: [],
          visible: false,
        }),
        cache: "no-store",
      });
      if (!res.ok) {
        const j = (await res.json()) as { message?: string };
        throw new Error(j.message ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { page: StaticPage };
      setPages([...pages, data.page]);
      setSelected(data.page.id);
      setCreatingNew(false);
      setNewSlug("");
      toast({ title: "ایجاد شد", description: "صفحه جدید ایجاد شد." });
    } catch (err) {
      toast({
        title: "خطا",
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSaving(false);
    }
  };

  const savePage = async (patch: Partial<StaticPage>) => {
    if (!page) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/pages/${encodeURIComponent(page.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
        cache: "no-store",
      });
      if (!res.ok) {
        const j = (await res.json()) as { message?: string };
        throw new Error(j.message ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { page: StaticPage };
      setPages(pages.map((p) => (p.id === data.page.id ? data.page : p)));
      toast({ title: "ذخیره شد", description: "صفحه با موفقیت ذخیره شد." });
    } catch (err) {
      toast({
        title: "خطا",
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSaving(false);
    }
  };

  const deletePage = async (id: string) => {
    if (!confirm("از حذف این صفحه مطمئن هستید؟ این عملیات قابل بازگشت نیست.")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/pages/${encodeURIComponent(id)}`, {
        method: "DELETE",
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const remaining = pages.filter((p) => p.id !== id);
      setPages(remaining);
      if (selected === id) setSelected(remaining[0]?.id ?? null);
      toast({ title: "حذف شد", description: "صفحه حذف شد." });
    } catch (err) {
      toast({
        title: "خطا",
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSection = (idx: number, patch: Partial<StaticPageSection>) => {
    if (!page) return;
    const sections = [...page.sections];
    sections[idx] = { ...sections[idx], ...patch };
    savePage({ sections });
  };

  const addSection = () => {
    if (!page) return;
    const newSec: StaticPageSection = {
      id: `s${Date.now()}`,
      heading: "بخش جدید",
      body: "",
      visible: true,
    };
    savePage({ sections: [...page.sections, newSec] });
  };

  const deleteSection = (idx: number) => {
    if (!page) return;
    const sections = page.sections.filter((_, i) => i !== idx);
    savePage({ sections });
  };

  return (
    <>
      <PageHead
        title="مدیریت صفحات ایستا"
        subtitle="ویرایش محتوای صفحات اطلاعاتی سایت"
        actions={
          <button
            className="admin-btn admin-btn-primary"
            onClick={() => setCreatingNew(true)}
            disabled={saving}
          >
            + صفحه جدید
          </button>
        }
      />

      {loading && <Notice variant="info">در حال بارگذاری…</Notice>}
      {error && <Notice variant="danger">خطا: {error}</Notice>}

      {creatingNew && (
        <Card title="ایجاد صفحه جدید">
          <Field label="آدرس (slug)" hint="kebab-case لاتین، بدون فاصله">
            <input
              className="admin-input admin-mono"
              dir="ltr"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              placeholder="مثلاً accessibility"
            />
          </Field>
          <div className="admin-row" style={{ justifyContent: "flex-end", marginTop: "0.5rem" }}>
            <button
              className="admin-btn admin-btn-ghost"
              onClick={() => {
                setCreatingNew(false);
                setNewSlug("");
              }}
            >
              انصراف
            </button>
            <button
              className="admin-btn admin-btn-primary"
              onClick={createPage}
              disabled={saving}
            >
              ایجاد
            </button>
          </div>
        </Card>
      )}

      {!loading && pages.length === 0 && !creatingNew && (
        <EmptyState
          title="صفحه‌ای وجود ندارد"
          desc="اولین صفحه را ایجاد کنید."
        />
      )}

      {!loading && pages.length > 0 && page && (
        <div className="admin-split">
          <Card title="صفحات" tight>
            {pages.map((p) => (
              <div
                key={p.id}
                className={`admin-tree-row ${p.id === selected ? "is-selected" : ""}`}
                style={{
                  display: "flex",
                  borderBottom: "1px solid var(--admin-border-soft)",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 0.75rem",
                }}
              >
                <button
                  style={{
                    flex: 1,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "start",
                    padding: 0,
                  }}
                  onClick={() => setSelected(p.id)}
                >
                  <strong style={{ display: "block", fontSize: 12.5 }}>
                    {p.title}
                  </strong>
                  <span className="admin-muted admin-mono">/{p.slug}</span>
                </button>
                {p.visible ? (
                  <Badge variant="success">عمومی</Badge>
                ) : (
                  <Badge variant="neutral">پنهان</Badge>
                )}
                <button
                  className="admin-btn admin-btn-sm admin-btn-ghost"
                  onClick={() => deletePage(p.id)}
                  disabled={saving}
                >
                  حذف
                </button>
              </div>
            ))}
          </Card>

          <div className="admin-stack">
            <Card title="مشخصات صفحه">
              <div className="admin-grid-2">
                <Field label="عنوان صفحه">
                  <input
                    className="admin-input"
                    defaultValue={page.title}
                    onBlur={(e) =>
                      e.target.value !== page.title &&
                      savePage({ title: e.target.value })
                    }
                  />
                </Field>
                <Field label="عنوان کوتاه (eyebrow)">
                  <input
                    className="admin-input"
                    defaultValue={page.eyebrow}
                    onBlur={(e) =>
                      e.target.value !== page.eyebrow &&
                      savePage({ eyebrow: e.target.value })
                    }
                  />
                </Field>
              </div>
              <Field label="زیرعنوان">
                <input
                  className="admin-input"
                  defaultValue={page.subtitle}
                  onBlur={(e) =>
                    e.target.value !== page.subtitle &&
                    savePage({ subtitle: e.target.value })
                  }
                />
              </Field>
              <div className="admin-grid-3">
                <Field label="آدرس (slug)">
                  <input
                    className="admin-input admin-mono"
                    dir="ltr"
                    defaultValue={page.slug}
                    onBlur={(e) =>
                      e.target.value !== page.slug &&
                      savePage({ slug: e.target.value })
                    }
                  />
                </Field>
                <Field label="آخرین به‌روزرسانی">
                  <input
                    className="admin-input"
                    dir="ltr"
                    value={new Intl.DateTimeFormat("fa-IR").format(
                      new Date(page.updatedAt)
                    )}
                    readOnly
                  />
                </Field>
                <Field label="نسخه">
                  <input
                    className="admin-input"
                    defaultValue={page.version}
                    onBlur={(e) =>
                      e.target.value !== page.version &&
                      savePage({ version: e.target.value })
                    }
                  />
                </Field>
              </div>
              <div className="admin-row-between" style={{ marginTop: "0.5rem" }}>
                <span style={{ fontSize: 13, color: "var(--admin-ink)" }}>
                  نمایش عمومی صفحه
                </span>
                <Switch
                  on={page.visible}
                  onChange={(v) => savePage({ visible: v })}
                />
              </div>
              <div className="admin-row" style={{ marginTop: "0.5rem" }}>
                <Link
                  href={`/p/${page.slug}`}
                  target="_blank"
                  className="admin-btn admin-btn-sm admin-btn-ghost"
                >
                  مشاهده صفحه ←
                </Link>
              </div>
            </Card>

            <Card
              title="بخش‌های محتوا"
              desc={`${faNum(page.sections.length)} بخش`}
              actions={
                <button
                  className="admin-btn admin-btn-sm admin-btn-primary"
                  onClick={addSection}
                  disabled={saving}
                >
                  + بخش جدید
                </button>
              }
            >
              <div className="admin-stack">
                {page.sections.map((s, i) => (
                  <div
                    key={s.id}
                    style={{
                      border: "1px solid var(--admin-border)",
                      borderRadius: 4,
                      padding: "0.75rem",
                    }}
                  >
                    <div className="admin-row" style={{ marginBottom: "0.5rem" }}>
                      <Badge variant="neutral">بخش {faNum(i + 1)}</Badge>
                      <div style={{ flex: 1 }} />
                      <Switch
                        on={s.visible}
                        onChange={(v) => updateSection(i, { visible: v })}
                      />
                      <button
                        className="admin-btn admin-btn-sm admin-btn-ghost"
                        onClick={() => deleteSection(i)}
                        disabled={saving}
                      >
                        حذف
                      </button>
                    </div>
                    <Field label="عنوان بخش (H2)">
                      <input
                        className="admin-input"
                        defaultValue={s.heading}
                        onBlur={(e) =>
                          e.target.value !== s.heading &&
                          updateSection(i, { heading: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="متن بخش" hint="پشتیبانی از Markdown">
                      <textarea
                        className="admin-textarea"
                        rows={4}
                        defaultValue={s.body}
                        onBlur={(e) =>
                          e.target.value !== s.body &&
                          updateSection(i, { body: e.target.value })
                        }
                      />
                    </Field>
                  </div>
                ))}
                {page.sections.length === 0 && (
                  <EmptyState title="بخشی وجود ندارد" />
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
