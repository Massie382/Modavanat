"use client";

import { useEffect, useState } from "react";
import { PageHead, Card, Tabs, Field, Switch, Notice, EmptyState, faNum } from "@/components/admin/primitives";
import { useToast } from "@/hooks/use-toast";

// Phase 7 — wired to /api/admin/vocabularies. Entries are stored as a
// JSONB array per vocabulary namespace in the `vocabularies` table.

interface VocabEntry {
  id: string;
  label: string;
  englishLabel?: string;
  description?: string;
  active: boolean;
}
interface VocabRow {
  key: string;
  label: string;
  entries: VocabEntry[];
  hasEnglishLabel?: boolean;
}

export default function VocabulariesPage() {
  const { toast } = useToast();
  const [vocabList, setVocabList] = useState<VocabRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<string>("status");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/vocabularies", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as {
          vocabularies: { key: string; label: string; entries: VocabEntry[] }[];
        };
        if (cancelled) return;
        if (data.vocabularies.length === 0) {
          setVocabList([]);
          setError("هیچ واژگی یافت نشد. پایگاه داده را بازنشانی کنید.");
          return;
        }
        // Mark "hasEnglishLabel" by inspecting existing entries.
        const rows: VocabRow[] = data.vocabularies.map((v) => ({
          key: v.key,
          label: v.label,
          entries: v.entries,
          hasEnglishLabel: v.entries.some((e) => e.englishLabel),
        }));
        setVocabList(rows);
        // If current tab doesn't exist in fetched data, switch to first.
        if (!rows.some((r) => r.key === tab) && rows.length > 0) {
          setTab(rows[0].key);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab]);

  const vocab = vocabList.find((v) => v.key === tab);

  const updateEntries = async (entries: VocabEntry[]) => {
    if (!vocab) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/vocabularies/${encodeURIComponent(vocab.key)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
        cache: "no-store",
      });
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const j = (await res.json()) as { message?: string };
          if (j.message) msg = j.message;
        } catch {
          // ignore
        }
        throw new Error(msg);
      }
      const data = (await res.json()) as { vocabulary: VocabRow };
      setVocabList((prev) =>
        prev.map((v) => (v.key === data.vocabulary.key ? data.vocabulary : v))
      );
      toast({ title: "ذخیره شد", description: `واژگان ${vocab.label} ذخیره شد.` });
    } catch (err) {
      toast({
        title: "خطا",
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSaving(false);
    }
  };

  const addEntry = () => {
    if (!vocab) return;
    const newEntry: VocabEntry = {
      id: `new-${Date.now()}`,
      label: "مورد جدید",
      ...(vocab.hasEnglishLabel ? { englishLabel: "" } : {}),
      active: true,
    };
    updateEntries([...vocab.entries, newEntry]);
  };

  const deleteEntry = (id: string) => {
    if (!vocab) return;
    updateEntries(vocab.entries.filter((e) => e.id !== id));
  };

  const editEntry = (id: string, patch: Partial<VocabEntry>) => {
    if (!vocab) return;
    updateEntries(
      vocab.entries.map((e) => (e.id === id ? { ...e, ...patch } : e))
    );
  };

  return (
    <>
      <PageHead
        title="مدیریت واژگان"
        subtitle="واژگان کنترل‌شده برای طبقه‌بندی قوانین، اصلاحات و ارجاعات"
      />

      {loading && <Notice variant="info">در حال بارگذاری…</Notice>}
      {error && <Notice variant="danger">خطا: {error}</Notice>}

      {!loading && vocabList.length > 0 && (
        <Tabs
          tabs={vocabList.map((v) => ({
            id: v.key,
            label: v.label,
            count: v.entries.length,
          }))}
          active={tab}
          onChange={setTab}
        />
      )}

      {!loading && vocab && (
        <Card
          title={vocab.label}
          desc={`${faNum(vocab.entries.length)} مورد — برای افزودن، دکمه زیر را بزنید`}
          actions={
            <button
              className="admin-btn admin-btn-sm admin-btn-primary"
              onClick={addEntry}
              disabled={saving}
            >
              + مورد جدید
            </button>
          }
        >
          {vocab.entries.length === 0 ? (
            <EmptyState title="موردی وجود ندارد" />
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>برچسب فارسی</th>
                  {vocab.hasEnglishLabel && <th>برچسب انگلیسی</th>}
                  <th>توضیحات</th>
                  <th>شناسه</th>
                  <th className="col-narrow">فعال</th>
                  <th className="col-narrow">عمل</th>
                </tr>
              </thead>
              <tbody>
                {vocab.entries.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <input
                        className="admin-input admin-input-sm"
                        value={e.label}
                        onChange={(ev) => editEntry(e.id, { label: ev.target.value })}
                      />
                    </td>
                    {vocab.hasEnglishLabel && (
                      <td>
                        <input
                          className="admin-input admin-input-sm admin-mono"
                          dir="ltr"
                          value={e.englishLabel ?? ""}
                          onChange={(ev) =>
                            editEntry(e.id, { englishLabel: ev.target.value })
                          }
                        />
                      </td>
                    )}
                    <td>
                      <input
                        className="admin-input admin-input-sm"
                        value={e.description ?? ""}
                        placeholder="—"
                        onChange={(ev) =>
                          editEntry(e.id, {
                            description: ev.target.value || undefined,
                          })
                        }
                      />
                    </td>
                    <td>
                      <input
                        className="admin-input admin-input-sm admin-mono"
                        dir="ltr"
                        value={e.id}
                        onChange={(ev) => editEntry(e.id, { id: ev.target.value })}
                      />
                    </td>
                    <td className="col-narrow">
                      <Switch
                        on={e.active}
                        onChange={(v) => editEntry(e.id, { active: v })}
                      />
                    </td>
                    <td className="col-narrow">
                      <button
                        className="admin-btn admin-btn-sm admin-btn-ghost"
                        onClick={() => deleteEntry(e.id)}
                        disabled={saving}
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      <div className="admin-notice admin-notice-warning" style={{ marginTop: "1rem" }}>
        تغییر یا حذف موارد استفاده‌شده در قوانین موجود ممکن است باعث ناسازگاری شود. پیش از حذف، موارد استفاده را بررسی کنید.
      </div>
    </>
  );
}
