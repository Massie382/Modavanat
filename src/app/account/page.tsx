"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AccountShell, type AccountTab } from "@/components/account/AccountShell";
import { BookmarksTab } from "@/components/account/BookmarksTab";
import {
  SettingsTab,
  type UserSettings,
  type UserPreferences,
} from "@/components/account/SettingsTab";
import { TicketsTab, type Ticket } from "@/components/account/TicketsTab";
import { PurchasesTab, type Purchase } from "@/components/account/PurchasesTab";

// ── Types returned from our APIs ──────────────────────────────────────
interface BookmarkRow {
  id: string;
  lawId: string;
  note?: string | null;
  createdAt: string;
}
interface PurchaseRow {
  id: string;
  description: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "refunded" | "failed";
  method: string | null;
  invoiceNumber: string | null;
  paidAt: string | null;
  createdAt: string;
  date: string;
}

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [tab, setTab] = useState<AccountTab>("bookmarks");

  // Bookmarks
  const [bookmarks, setBookmarks] = useState<BookmarkRow[]>([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(true);

  // Settings + prefs
  const [settings, setSettings] = useState<UserSettings>({
    username: "",
    displayName: "",
    identifierKind: "email",
    identifier: "",
  });
  const [prefs, setPrefs] = useState<UserPreferences>({
    emailNotifications: true,
    smsNotifications: false,
    weeklyDigest: true,
    bookmarkAlerts: true,
  });
  const [settingsLoading, setSettingsLoading] = useState(true);

  // Tickets
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);

  // Purchases
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState(true);

  // ── Loaders ─────────────────────────────────────────────────────────
  const loadBookmarks = useCallback(async () => {
    setBookmarksLoading(true);
    try {
      const r = await fetch("/api/bookmarks");
      if (!r.ok) return;
      const j = await r.json();
      setBookmarks(j.bookmarks ?? []);
    } catch {
      /* network error — keep last state */
    } finally {
      setBookmarksLoading(false);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const r = await fetch("/api/users/me");
      if (!r.ok) return;
      const j = await r.json();
      if (j.user) {
        setSettings({
          username: j.user.name ?? "",
          displayName: j.user.name ?? "",
          identifierKind: "email",
          identifier: j.user.email ?? "",
        });
      }
      if (j.prefs) {
        setPrefs({
          emailNotifications: j.prefs.emailNotifications ?? true,
          smsNotifications: j.prefs.smsNotifications ?? false,
          weeklyDigest: j.prefs.weeklyDigest ?? true,
          bookmarkAlerts: j.prefs.bookmarkAlerts ?? true,
        });
      }
    } catch {
      /* ignore */
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  const loadTickets = useCallback(async () => {
    setTicketsLoading(true);
    try {
      const r = await fetch("/api/tickets");
      if (!r.ok) return;
      const j = await r.json();
      setTickets(j.tickets ?? []);
    } catch {
      /* ignore */
    } finally {
      setTicketsLoading(false);
    }
  }, []);

  const loadPurchases = useCallback(async () => {
    setPurchasesLoading(true);
    try {
      const r = await fetch("/api/purchases");
      if (!r.ok) return;
      const j = await r.json();
      setPurchases(j.purchases ?? []);
    } catch {
      /* ignore */
    } finally {
      setPurchasesLoading(false);
    }
  }, []);

  // ── Boot: redirect to /signin if unauthenticated, else load all ─────
  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/signin?callbackUrl=/account");
      return;
    }
    void loadBookmarks();
    void loadSettings();
    void loadTickets();
    void loadPurchases();
  }, [status, router, loadBookmarks, loadSettings, loadTickets, loadPurchases]);

  // ── Handlers ────────────────────────────────────────────────────────
  const handleRemoveBookmark = async (lawId: string) => {
    // Optimistic update — remove locally, then hit the API.
    setBookmarks((prev) => prev.filter((b) => b.lawId !== lawId));
    try {
      await fetch(`/api/bookmarks?lawId=${encodeURIComponent(lawId)}`, {
        method: "DELETE",
      });
    } catch {
      // Roll back on failure.
      void loadBookmarks();
    }
  };

  const handleUpdateSettings = async (next: UserSettings) => {
    setSettings(next);
    // Fire-and-forget the API call — the SettingsTab UI shows a
    // success toast as soon as the call resolves.
    await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: next.displayName }),
    });
  };

  const handleUpdatePreferences = async (next: UserPreferences) => {
    setPrefs(next);
    await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(next),
    });
  };

  // ── Loading / unauthenticated states ─────────────────────────────────
  if (status === "loading" || status === "unauthenticated") {
    return <div className="min-h-[60vh]" />;
  }

  const user = session?.user;
  const userName = user?.name ?? user?.email ?? "کاربر";
  const userIdentifier = user?.email ?? "";
  const userInitials =
    (user?.name ?? user?.email ?? "?")
      .trim()
      .split(/\s+/)
      .map((s) => s[0])
      .slice(0, 2)
      .join("") ?? "؟";

  const counts: Record<AccountTab, number> = {
    bookmarks: bookmarks.length,
    settings: 0,
    tickets: tickets.filter((t) => t.status === "open").length,
    purchases: purchases.length,
  };

  return (
    <AccountShell
      activeTab={tab}
      onTabChange={setTab}
      counts={counts}
      userName={userName}
      userIdentifier={userIdentifier}
      userInitials={userInitials}
    >
      {tab === "bookmarks" && (
        <BookmarksTab
          bookmarks={bookmarks.map((b) => ({
            lawId: b.lawId,
            addedAt: new Date(b.createdAt).toLocaleDateString("fa-IR"),
            note: b.note ?? undefined,
          }))}
          onRemove={handleRemoveBookmark}
          loading={bookmarksLoading}
        />
      )}
      {tab === "settings" && (
        <SettingsTab
          settings={settings}
          preferences={prefs}
          onUpdateSettings={handleUpdateSettings}
          onUpdatePreferences={handleUpdatePreferences}
          loading={settingsLoading}
        />
      )}
      {tab === "tickets" && (
        <TicketsTab
          tickets={tickets}
          loading={ticketsLoading}
          onRefresh={loadTickets}
        />
      )}
      {tab === "purchases" && (
        <PurchasesTab
          purchases={purchases.map((p) => ({
            id: p.id,
            date: new Date(p.date).toLocaleDateString("fa-IR"),
            description: p.description,
            amount: p.amount,
            status: p.status,
            method: p.method ?? "",
            invoiceNumber: p.invoiceNumber ?? "",
          }))}
          loading={purchasesLoading}
        />
      )}
    </AccountShell>
  );
}
