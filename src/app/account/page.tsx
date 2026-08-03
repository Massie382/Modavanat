"use client";

import { useState } from "react";
import { AccountShell, type AccountTab } from "@/components/account/AccountShell";
import { BookmarksTab } from "@/components/account/BookmarksTab";
import { SettingsTab, type UserSettings, type UserPreferences } from "@/components/account/SettingsTab";
import { TicketsTab, type Ticket } from "@/components/account/TicketsTab";
import { PurchasesTab, type Purchase } from "@/components/account/PurchasesTab";

/* ── Mock user data ──
   Until real auth is wired up, the panel uses a simulated signed-in
   user. Replace with `useSession()` once next-auth is configured. */
const MOCK_USER = {
  userName: "کاربر نمونه",
  userIdentifier: "user@example.com",
  userInitials: "ک‌ن",
};

const INITIAL_BOOKMARKS = [
  { lawId: "q-madani-1307", addedAt: "۱۴۰۴/۰۴/۲۲", note: "برای پروندهٔ ارث" },
  { lawId: "q-majazat-1392", addedAt: "۱۴۰۴/۰۴/۱۸" },
  { lawId: "q-tejarat-1347", addedAt: "۱۴۰۴/۰۳/۱۱", note: "ماده ۲ را بازخوانی کن" },
  { lawId: "q-kar-1369", addedAt: "۱۴۰۴/۰۲/۲۷" },
  { lawId: "q-asasi-1368", addedAt: "۱۴۰۳/۱۲/۳۰" },
];

const INITIAL_SETTINGS: UserSettings = {
  username: "user_example",
  displayName: "کاربر نمونه",
  identifierKind: "email",
  identifier: "user@example.com",
};

const INITIAL_PREFS: UserPreferences = {
  emailNotifications: true,
  smsNotifications: false,
  weeklyDigest: true,
  bookmarkAlerts: true,
};

const INITIAL_TICKETS: Ticket[] = [
  {
    id: "T-1404-018",
    subject: "مشکل در نمایش جدول ارجاعات",
    category: "گزارش مشکل فنی",
    status: "open",
    createdAt: "۱۴۰۴/۰۴/۱۵",
    updatedAt: "۱۴۰۴/۰۴/۱۷",
    lastReply: "در حال بررسی توسط تیم فنی…",
    messages: [
      { from: "user", text: "در صفحهٔ قانون مدنی، جدول ارجاعات در موبایل به‌هم می‌ریزد.", at: "۱۴۰۴/۰۴/۱۵" },
      { from: "support", text: "سپاس از گزارش. در حال بررسی هستیم؛ ظرف ۴۸ ساعت نتیجه را اعلام می‌کنیم.", at: "۱۴۰۴/۰۴/۱۷" },
    ],
  },
  {
    id: "T-1404-012",
    subject: "درخواست افزودن قانون فعالیت احزاب",
    category: "درخواست افزودن قانون",
    status: "pending",
    createdAt: "۱۴۰۴/۰۳/۲۰",
    updatedAt: "۱۴۰۴/۰۳/۲۲",
    lastReply: "منتظر تأیید محتوای تیم ویراستاری.",
    messages: [
      { from: "user", text: "لطفاً قانون فعالیت احزاب (۱۳۶۰) را اضافه کنید.", at: "۱۴۰۴/۰۳/۲۰" },
      { from: "support", text: "درخواست شما ثبت شد و در صف بررسی است.", at: "۱۴۰۴/۰۳/۲۲" },
    ],
  },
  {
    id: "T-1403-044",
    subject: "پرسش دربارهٔ اشتراک پریمیوم",
    category: "سایر",
    status: "closed",
    createdAt: "۱۴۰۳/۱۱/۰۸",
    updatedAt: "۱۴۰۳/۱۱/۱۰",
    lastReply: "با تشکر، پاسخ داده شد.",
    messages: [
      { from: "user", text: "آیا اشتراک پریمیوم شامل دسترسی به API هم هست؟", at: "۱۴۰۳/۱۱/۰۸" },
      { from: "support", text: "بله، در پلن سازمانی. جزئیات در صفحهٔ اشتراک.", at: "۱۴۰۳/۱۱/۱۰" },
    ],
  },
];

const INITIAL_PURCHASES: Purchase[] = [
  {
    id: "P-1404-009",
    date: "۱۴۰۴/۰۴/۰۱",
    description: "اشتراک پریمیوم سالانه",
    amount: 480000,
    status: "paid",
    method: "درگاه بانکی (زرین‌پال)",
    invoiceNumber: "INV-1404-009",
  },
  {
    id: "P-1404-003",
    date: "۱۴۰۴/۰۱/۱۵",
    description: "بستهٔ API حرفه‌ای (ماهانه)",
    amount: 95000,
    status: "paid",
    method: "درگاه بانکی (زرین‌پال)",
    invoiceNumber: "INV-1404-003",
  },
  {
    id: "P-1403-118",
    date: "۱۴۰۳/۱۰/۲۰",
    description: "اشتراک پریمیوم سالانه",
    amount: 460000,
    status: "paid",
    method: "درگاه بانکی (زرین‌پال)",
    invoiceNumber: "INV-1403-118",
  },
  {
    id: "P-1403-092",
    date: "۱۴۰۳/۰۸/۰۵",
    description: "بستهٔ گزارش تخصصی",
    amount: 35000,
    status: "refunded",
    method: "درگاه بانکی (زرین‌پال)",
    invoiceNumber: "INV-1403-092",
  },
];

export default function AccountPage() {
  const [tab, setTab] = useState<AccountTab>("bookmarks");

  const [bookmarks, setBookmarks] = useState(INITIAL_BOOKMARKS);
  const [settings, setSettings] = useState<UserSettings>(INITIAL_SETTINGS);
  const [prefs, setPrefs] = useState<UserPreferences>(INITIAL_PREFS);
  const [tickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [purchases] = useState<Purchase[]>(INITIAL_PURCHASES);

  const handleRemoveBookmark = (lawId: string) => {
    setBookmarks((prev) => prev.filter((b) => b.lawId !== lawId));
  };

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
      userName={MOCK_USER.userName}
      userIdentifier={MOCK_USER.userIdentifier}
      userInitials={MOCK_USER.userInitials}
    >
      {tab === "bookmarks" && (
        <BookmarksTab
          bookmarks={bookmarks}
          onRemove={handleRemoveBookmark}
        />
      )}
      {tab === "settings" && (
        <SettingsTab
          settings={settings}
          preferences={prefs}
          onUpdateSettings={setSettings}
          onUpdatePreferences={setPrefs}
        />
      )}
      {tab === "tickets" && (
        <TicketsTab tickets={tickets} />
      )}
      {tab === "purchases" && (
        <PurchasesTab purchases={purchases} />
      )}
    </AccountShell>
  );
}
