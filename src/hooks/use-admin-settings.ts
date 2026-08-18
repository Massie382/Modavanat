"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * useAdminSettings — load + persist a single settings namespace via
 * /api/admin/settings?key=<namespace>.
 *
 * Phase 7. Replaces the per-page inlined mocks (brandingMock,
 * navigationMock, ...) with a real GET-on-mount + PATCH-on-save flow.
 *
 * Usage:
 *   const { data, loading, error, save, saving, reload } =
 *     useAdminSettings<MySettingsType>("branding", defaultSettings);
 *
 *   // data starts as defaultSettings, replaced with whatever the
 *   // server returns on mount (deep-merged on top of defaults so
 *   // newly added fields show up even on old DB rows).
 *
 *   save()  // PATCH /api/admin/settings?key=branding with current `data`
 *
 *   // For mutations, mutate `data` via setData then call save():
 *   const [data, setData] = useState(defaultSettings);
 *   — instead, this hook exposes setData; pass it new values then
 *   call save().
 */
export interface UseAdminSettingsResult<T> {
  data: T;
  setData: (next: T | ((prev: T) => T)) => void;
  loading: boolean;
  error: string | null;
  saving: boolean;
  save: () => Promise<boolean>;
  reload: () => Promise<void>;
}

export function useAdminSettings<T>(
  key: string,
  defaults: T
): UseAdminSettingsResult<T> {
  const [data, setDataState] = useState<T>(defaults);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/settings?key=${encodeURIComponent(key)}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { value?: Record<string, unknown> };
      const serverValue = (json.value ?? {}) as Partial<T>;
      // Deep-merge server value on top of defaults so newly added
      // fields show up even on old DB rows. We can't import deepMerge
      // from a server-only module here, so do a 1-level shallow merge
      // of nested objects. Good enough for the settings shapes.
      const merged: T = { ...defaults };
      for (const [k, v] of Object.entries(serverValue)) {
        const dk = (defaults as Record<string, unknown>)[k];
        if (
          v !== null &&
          typeof v === "object" &&
          !Array.isArray(v) &&
          dk !== null &&
          typeof dk === "object" &&
          !Array.isArray(dk)
        ) {
          (merged as Record<string, unknown>)[k] = { ...(dk as Record<string, unknown>), ...(v as Record<string, unknown>) };
        } else {
          (merged as Record<string, unknown>)[k] = v;
        }
      }
      setDataState(merged);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [key, defaults]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/settings?key=${encodeURIComponent(key)}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as { value?: Record<string, unknown> };
        const serverValue = (json.value ?? {}) as Partial<T>;
        const merged: T = { ...defaults };
        for (const [k, v] of Object.entries(serverValue)) {
          const dk = (defaults as Record<string, unknown>)[k];
          if (
            v !== null &&
            typeof v === "object" &&
            !Array.isArray(v) &&
            dk !== null &&
            typeof dk === "object" &&
            !Array.isArray(dk)
          ) {
            (merged as Record<string, unknown>)[k] = { ...(dk as Record<string, unknown>), ...(v as Record<string, unknown>) };
          } else {
            (merged as Record<string, unknown>)[k] = v;
          }
        }
        if (!cancelled) setDataState(merged);
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
  }, [key]);

  const setData = useCallback((next: T | ((prev: T) => T)) => {
    setDataState((prev) => (typeof next === "function" ? (next as (p: T) => T)(prev) : next));
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/settings?key=${encodeURIComponent(key)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
          cache: "no-store",
        }
      );
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
      const json = (await res.json()) as { value?: Record<string, unknown> };
      if (json.value) setDataState(json.value as T);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return false;
    } finally {
      setSaving(false);
    }
  }, [key, data]);

  return { data, setData, loading, error, saving, save, reload };
}
