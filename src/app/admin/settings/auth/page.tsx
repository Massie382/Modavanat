"use client";

import { useState } from "react";
import { PageHead, Card, Field, Switch, Tabs, Notice } from "@/components/admin/primitives";
import { useToast } from "@/hooks/use-toast";
import { useAdminSettings } from "@/hooks/use-admin-settings";
import { faNum } from "@/components/admin/primitives";

// Phase 7 — wired to /api/admin/settings?key=auth.
interface AuthSettings {
  allowedIdentifiers: { id: "email" | "phone"; label: string; enabled: boolean }[];
  passwordMinLengthSignin: number;
  passwordMinLengthSignup: number;
  passwordMinLengthReset: number;
  strengthThresholds: { weak: number; medium: number; good: number; strong: number };
  otpLength: number;
  otpResendCooldownSec: number;
  rememberMeDefault: boolean;
  requireAgreement: boolean;
  agreementLinks: { label: string; href: string }[];
  signinPage: { eyebrow: string; title: string; subtitle: string };
  signupPage: { eyebrow: string; title: string; subtitle: string };
  forgotPasswordPage: { eyebrow: string; title: string; subtitle: string };
}

const defaults: AuthSettings = {
  allowedIdentifiers: [
    { id: "email", label: "ایمیل", enabled: true },
    { id: "phone", label: "شماره تلفن", enabled: true },
  ],
  passwordMinLengthSignin: 6,
  passwordMinLengthSignup: 8,
  passwordMinLengthReset: 8,
  strengthThresholds: { weak: 1, medium: 2, good: 3, strong: 4 },
  otpLength: 6,
  otpResendCooldownSec: 60,
  rememberMeDefault: true,
  requireAgreement: true,
  agreementLinks: [
    { label: "حریم خصوصی", href: "/privacy" },
    { label: "شرایط استفاده", href: "/terms" },
  ],
  signinPage: {
    eyebrow: "ورود به حساب",
    title: "خوش آمدید",
    subtitle: "برای دسترسی به امکانات شخصی مدونات وارد شوید.",
  },
  signupPage: {
    eyebrow: "ثبت‌نام",
    title: "ساخت حساب کاربری",
    subtitle: "برای ذخیره قوانین موردعلاقه و یادآوری یادداشت‌ها ثبت‌نام کنید.",
  },
  forgotPasswordPage: {
    eyebrow: "بازیابی رمز عبور",
    title: "رمز عبور را فراموش کرده‌اید؟",
    subtitle: "ایمیل یا شماره تلفن خود را وارد کنید تا کد بازنشانی برای شما ارسال شود.",
  },
};

export default function AuthSettingsPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState("general");
  const { data, setData, loading, error, saving, save } =
    useAdminSettings<AuthSettings>("auth", defaults);

  const onSave = async () => {
    const ok = await save();
    toast({
      title: ok ? "ذخیره شد" : "خطا",
      description: ok ? "تنظیمات احراز هویت ذخیره شد." : error ?? "خطا در ذخیره",
    });
  };

  const updateIdentifier = (i: number, enabled: boolean) => {
    const next = [...data.allowedIdentifiers];
    next[i] = { ...next[i], enabled };
    setData({ ...data, allowedIdentifiers: next });
  };
  const updateSignin = (patch: Partial<AuthSettings["signinPage"]>) =>
    setData({ ...data, signinPage: { ...data.signinPage, ...patch } });
  const updateSignup = (patch: Partial<AuthSettings["signupPage"]>) =>
    setData({ ...data, signupPage: { ...data.signupPage, ...patch } });
  const updateForgot = (patch: Partial<AuthSettings["forgotPasswordPage"]>) =>
    setData({ ...data, forgotPasswordPage: { ...data.forgotPasswordPage, ...patch } });

  return (
    <>
      <PageHead
        title="تنظیمات احراز هویت"
        subtitle="ورود، ثبت‌نام و بازیابی رمز عبور"
        actions={
          <button
            className="admin-btn admin-btn-primary"
            onClick={onSave}
            disabled={saving || loading}
          >
            {saving ? "در حال ذخیره…" : "ذخیره"}
          </button>
        }
      />
      {loading && <Notice variant="info">در حال بارگذاری…</Notice>}
      {error && <Notice variant="danger">خطا: {error}</Notice>}
      <Tabs
        tabs={[
          { id: "general", label: "عمومی" },
          { id: "signin", label: "ورود" },
          { id: "signup", label: "ثبت‌نام" },
          { id: "forgot", label: "بازیابی رمز" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "general" && (
        <div className="admin-stack">
          <Card title="روش‌های ورود مجاز">
            <div className="admin-stack-sm">
              {data.allowedIdentifiers.map((i, idx) => (
                <div key={i.id} className="admin-row-between">
                  <span style={{ fontSize: 13 }}>{i.label}</span>
                  <Switch on={i.enabled} onChange={(v) => updateIdentifier(idx, v)} />
                </div>
              ))}
            </div>
          </Card>
          <Card title="قوانین رمز عبور">
            <div className="admin-grid-3">
              <Field label="حداقل طول (ورود)">
                <input
                  className="admin-input"
                  type="number"
                  dir="ltr"
                  value={data.passwordMinLengthSignin}
                  onChange={(e) =>
                    setData({ ...data, passwordMinLengthSignin: Number(e.target.value) || 0 })
                  }
                />
              </Field>
              <Field label="حداقل طول (ثبت‌نام)">
                <input
                  className="admin-input"
                  type="number"
                  dir="ltr"
                  value={data.passwordMinLengthSignup}
                  onChange={(e) =>
                    setData({ ...data, passwordMinLengthSignup: Number(e.target.value) || 0 })
                  }
                />
              </Field>
              <Field label="حداقل طول (بازیابی)">
                <input
                  className="admin-input"
                  type="number"
                  dir="ltr"
                  value={data.passwordMinLengthReset}
                  onChange={(e) =>
                    setData({ ...data, passwordMinLengthReset: Number(e.target.value) || 0 })
                  }
                />
              </Field>
            </div>
          </Card>
          <Card title="کد یکبار مصرف (OTP)">
            <div className="admin-grid-2">
              <Field label="طول کد">
                <input
                  className="admin-input"
                  type="number"
                  dir="ltr"
                  value={data.otpLength}
                  onChange={(e) => setData({ ...data, otpLength: Number(e.target.value) || 0 })}
                />
              </Field>
              <Field label="تأخیر ارسال مجدد (ثانیه)">
                <input
                  className="admin-input"
                  type="number"
                  dir="ltr"
                  value={data.otpResendCooldownSec}
                  onChange={(e) =>
                    setData({ ...data, otpResendCooldownSec: Number(e.target.value) || 0 })
                  }
                />
              </Field>
            </div>
          </Card>
          <Card title="سایر">
            <div className="admin-row-between">
              <span style={{ fontSize: 13 }}>«مرا به خاطر بسپار» به‌صورت پیش‌فرض روشن</span>
              <Switch
                on={data.rememberMeDefault}
                onChange={(v) => setData({ ...data, rememberMeDefault: v })}
              />
            </div>
            <div className="admin-row-between">
              <span style={{ fontSize: 13 }}>الزام تأیید شرایط</span>
              <Switch
                on={data.requireAgreement}
                onChange={(v) => setData({ ...data, requireAgreement: v })}
              />
            </div>
          </Card>
        </div>
      )}

      {tab === "signin" && (
        <Card title="متن‌های صفحه ورود">
          <Field label="Eyebrow">
            <input
              className="admin-input"
              value={data.signinPage.eyebrow}
              onChange={(e) => updateSignin({ eyebrow: e.target.value })}
            />
          </Field>
          <Field label="عنوان">
            <input
              className="admin-input"
              value={data.signinPage.title}
              onChange={(e) => updateSignin({ title: e.target.value })}
            />
          </Field>
          <Field label="زیرعنوان">
            <textarea
              className="admin-textarea"
              rows={2}
              value={data.signinPage.subtitle}
              onChange={(e) => updateSignin({ subtitle: e.target.value })}
            />
          </Field>
        </Card>
      )}

      {tab === "signup" && (
        <Card title="متن‌های صفحه ثبت‌نام">
          <Field label="Eyebrow">
            <input
              className="admin-input"
              value={data.signupPage.eyebrow}
              onChange={(e) => updateSignup({ eyebrow: e.target.value })}
            />
          </Field>
          <Field label="عنوان">
            <input
              className="admin-input"
              value={data.signupPage.title}
              onChange={(e) => updateSignup({ title: e.target.value })}
            />
          </Field>
          <Field label="زیرعنوان">
            <textarea
              className="admin-textarea"
              rows={2}
              value={data.signupPage.subtitle}
              onChange={(e) => updateSignup({ subtitle: e.target.value })}
            />
          </Field>
        </Card>
      )}

      {tab === "forgot" && (
        <Card title="متن‌های صفحه بازیابی رمز">
          <Field label="Eyebrow">
            <input
              className="admin-input"
              value={data.forgotPasswordPage.eyebrow}
              onChange={(e) => updateForgot({ eyebrow: e.target.value })}
            />
          </Field>
          <Field label="عنوان">
            <input
              className="admin-input"
              value={data.forgotPasswordPage.title}
              onChange={(e) => updateForgot({ title: e.target.value })}
            />
          </Field>
          <Field label="زیرعنوان">
            <textarea
              className="admin-textarea"
              rows={2}
              value={data.forgotPasswordPage.subtitle}
              onChange={(e) => updateForgot({ subtitle: e.target.value })}
            />
          </Field>
        </Card>
      )}

      <div className="admin-muted" style={{ textAlign: "center", padding: "1rem" }}>
        {faNum(data.otpLength)} رقمی
      </div>
    </>
  );
}
