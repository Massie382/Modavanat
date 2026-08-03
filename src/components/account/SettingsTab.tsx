"use client";

import { useState } from "react";
import { Field, PasswordInput } from "@/components/auth/AuthFields";

export interface UserSettings {
  username: string;
  displayName: string;
  identifierKind: "email" | "phone";
  identifier: string;
}

export interface UserPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  weeklyDigest: boolean;
  bookmarkAlerts: boolean;
}

interface SettingsTabProps {
  settings: UserSettings;
  preferences: UserPreferences;
  onUpdateSettings: (s: UserSettings) => void;
  onUpdatePreferences: (p: UserPreferences) => void;
}

export function SettingsTab({
  settings,
  preferences,
  onUpdateSettings,
  onUpdatePreferences,
}: SettingsTabProps) {
  const [draft, setDraft] = useState<UserSettings>(settings);
  const [prefs, setPrefs] = useState<UserPreferences>(preferences);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  // password change
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSavedAt, setPwSavedAt] = useState<string | null>(null);

  const handleSaveProfile = () => {
    onUpdateSettings(draft);
    setSavedAt("ذخیره شد");
    setTimeout(() => setSavedAt(null), 3000);
  };

  const handleSavePrefs = (next: UserPreferences) => {
    setPrefs(next);
    onUpdatePreferences(next);
  };

  const handleChangePassword = () => {
    setPwError(null);
    if (!pw.current) return setPwError("رمز عبور فعلی را وارد کنید.");
    if (pw.next.length < 8) return setPwError("رمز عبور جدید باید حداقل ۸ نویسه باشد.");
    if (pw.next !== pw.confirm) return setPwError("تکرار رمز عبور جدید مطابقت ندارد.");
    setPw({ current: "", next: "", confirm: "" });
    setPwSavedAt("رمز عبور تغییر کرد");
    setTimeout(() => setPwSavedAt(null), 3000);
  };

  return (
    <>
      <div className="panel-content-header">
        <div>
          <h2 className="panel-content-title">تنظیمات</h2>
          <p className="panel-content-subtitle">مدیریت حساب کاربری، رمز عبور و ترجیحات.</p>
        </div>
      </div>

      <div className="panel-content-body space-y-8">
        {/* Profile section */}
        <section className="panel-form-section">
          <h3 className="panel-form-section-title">پروفایل</h3>
          <p className="panel-form-section-desc">
            نام نمایشی و شناسهٔ ورود شما. این اطلاعات برای ورود و نمایش نام شما در سایت استفاده می‌شود.
          </p>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="نام کاربری" htmlFor="settings-username" hint="غیرقابل تغییر">
                <input
                  id="settings-username"
                  type="text"
                  value={draft.username}
                  readOnly
                  disabled
                  className="auth-input"
                  style={{ opacity: 0.65, cursor: "not-allowed" }}
                />
              </Field>
              <Field label="نام نمایشی" htmlFor="settings-display">
                <input
                  id="settings-display"
                  type="text"
                  value={draft.displayName}
                  onChange={(e) => setDraft({ ...draft, displayName: e.target.value })}
                  className="auth-input"
                />
              </Field>
            </div>

            <Field
              label={draft.identifierKind === "email" ? "ایمیل" : "شماره تلفن"}
              htmlFor="settings-identifier"
            >
              <input
                id="settings-identifier"
                type={draft.identifierKind === "email" ? "email" : "tel"}
                value={draft.identifier}
                onChange={(e) => setDraft({ ...draft, identifier: e.target.value })}
                dir="ltr"
                className="auth-input"
                style={{ textAlign: "right" }}
              />
            </Field>

            <div className="flex items-center gap-3">
              <button type="button" className="btn-legal btn-legal-sm" onClick={handleSaveProfile}>
                ذخیره تغییرات
              </button>
              {savedAt && (
                <span className="text-[12px] text-[#2b5e2b] flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {savedAt}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Password section */}
        <section className="panel-form-section">
          <h3 className="panel-form-section-title">تغییر رمز عبور</h3>
          <p className="panel-form-section-desc">
            رمز عبور باید حداقل ۸ نویسه باشد. ترکیبی از حروف بزرگ و کوچک، عدد و نماد امنیت بیشتری فراهم می‌کند.
          </p>

          <div className="space-y-4">
            <Field label="رمز عبور فعلی" htmlFor="pw-current">
              <PasswordInput
                id="pw-current"
                value={pw.current}
                onChange={(v) => setPw({ ...pw, current: v })}
                placeholder="رمز عبور فعلی"
                autoComplete="current-password"
                ariaLabel="رمز عبور فعلی"
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="رمز عبور جدید" htmlFor="pw-new">
                <PasswordInput
                  id="pw-new"
                  value={pw.next}
                  onChange={(v) => setPw({ ...pw, next: v })}
                  placeholder="حداقل ۸ نویسه"
                  autoComplete="new-password"
                  showStrength
                  ariaLabel="رمز عبور جدید"
                />
              </Field>
              <Field label="تکرار رمز عبور جدید" htmlFor="pw-confirm">
                <PasswordInput
                  id="pw-confirm"
                  value={pw.confirm}
                  onChange={(v) => setPw({ ...pw, confirm: v })}
                  placeholder="تکرار رمز عبور جدید"
                  autoComplete="new-password"
                  ariaLabel="تکرار رمز عبور جدید"
                />
              </Field>
            </div>

            {pwError && <p className="auth-error">{pwError}</p>}

            <div className="flex items-center gap-3">
              <button type="button" className="btn-legal btn-legal-sm" onClick={handleChangePassword}>
                تغییر رمز عبور
              </button>
              {pwSavedAt && (
                <span className="text-[12px] text-[#2b5e2b] flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {pwSavedAt}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Preferences section */}
        <section className="panel-form-section">
          <h3 className="panel-form-section-title">ترجیحات اطلاع‌رسانی</h3>
          <p className="panel-form-section-desc">
            انتخاب کنید که کدام رویدادها باید به شما اطلاع داده شوند.
          </p>

          <div>
            <PrefRow
              title="اطلاع‌رسانی ایمیلی"
              desc="ارسال ایمیل برای پاسخ به تیکت‌ها و به‌روزرسانی‌های مهم."
              checked={prefs.emailNotifications}
              onChange={(v) => handleSavePrefs({ ...prefs, emailNotifications: v })}
            />
            <PrefRow
              title="اطلاع‌رسانی پیامکی"
              desc="ارسال پیامک برای موارد فوری (اختیاری، ممکن است هزینه‌برد)."
              checked={prefs.smsNotifications}
              onChange={(v) => handleSavePrefs({ ...prefs, smsNotifications: v })}
            />
            <PrefRow
              title="گزارش هفتگی"
              desc="خلاصه‌ای از قوانین جدید و اصلاحات هفته، هر یکشنبه."
              checked={prefs.weeklyDigest}
              onChange={(v) => handleSavePrefs({ ...prefs, weeklyDigest: v })}
            />
            <PrefRow
              title="هشدار نشانه‌گذاری‌ها"
              desc="وقتی قانونی که نشانه گذاشته‌اید اصلاح یا نسخ می‌شود، به من اطلاع بده."
              checked={prefs.bookmarkAlerts}
              onChange={(v) => handleSavePrefs({ ...prefs, bookmarkAlerts: v })}
            />
          </div>
        </section>

        {/* Danger zone */}
        <section className="panel-form-section" style={{ borderColor: "var(--destructive)" }}>
          <h3 className="panel-form-section-title" style={{ color: "var(--destructive)" }}>منطقهٔ خطر</h3>
          <p className="panel-form-section-desc">
            با حذف حساب، تمام نشانه‌ها، یادداشت‌ها و تاریخچهٔ خرید شما برای همیشه پاک می‌شود. این عمل قابل بازگشت نیست.
          </p>
          <button
            type="button"
            className="btn-legal btn-legal-sm"
            style={{
              backgroundColor: "transparent",
              color: "var(--destructive)",
              borderColor: "var(--destructive)",
            }}
            onClick={() => {
              if (typeof window !== "undefined" && window.confirm("آیا مطمئن هستید؟ این عمل قابل بازگشت نیست.")) {
                window.location.href = "/signin";
              }
            }}
          >
            حذف حساب کاربری
          </button>
        </section>
      </div>
    </>
  );
}

function PrefRow({
  title,
  desc,
  checked,
  onChange,
}: {
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="panel-pref">
      <div className="panel-pref-text">
        <div className="panel-pref-title">{title}</div>
        <div className="panel-pref-desc">{desc}</div>
      </div>
      <label className="panel-toggle">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="panel-toggle-track">
          <span className="panel-toggle-thumb" />
        </span>
      </label>
    </div>
  );
}
