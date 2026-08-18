"use client";

import { useState } from "react";
import { PageHead, Card, Field, Switch, Tabs, Notice } from "@/components/admin/primitives";
import { useToast } from "@/hooks/use-toast";
import { faNum } from "@/components/admin/primitives";

// Phase 7 — frontend only. Auth settings will be persisted via
// /api/admin/settings?key=auth (scaffolded) but the form below is not
// yet wired to read/write that endpoint.
const authSettingsMock = {
  allowedIdentifiers: [
    { id: "email" as const, label: "ایمیل", enabled: true },
    { id: "phone" as const, label: "شماره تلفن", enabled: true },
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
  signinPage: { eyebrow: "ورود به حساب", title: "خوش آمدید", subtitle: "برای دسترسی به امکانات شخصی مدونات وارد شوید." },
  signupPage: { eyebrow: "ثبت‌نام", title: "ساخت حساب کاربری", subtitle: "برای ذخیره قوانین موردعلاقه و یادآوری یادداشت‌ها ثبت‌نام کنید." },
  forgotPasswordPage: { eyebrow: "بازیابی رمز عبور", title: "رمز عبور را فراموش کرده‌اید؟", subtitle: "ایمیل یا شماره تلفن خود را وارد کنید تا کد بازنشانی برای شما ارسال شود." },
};

export default function AuthSettingsPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState("general");
  return (
    <>
      <PageHead title="تنظیمات احراز هویت" subtitle="ورود، ثبت‌نام و بازیابی رمز عبور" actions={<button className="admin-btn admin-btn-primary" onClick={() => toast({ title: "اطلاع", description: "ذخیره در فاز ۷." })}>ذخیره</button>} />
      <Notice variant="warning">Phase 7 — frontend only.</Notice>
      <Tabs tabs={[{ id: "general", label: "عمومی" }, { id: "signin", label: "ورود" }, { id: "signup", label: "ثبت‌نام" }, { id: "forgot", label: "بازیابی رمز" }]} active={tab} onChange={setTab} />

      {tab === "general" && (
        <div className="admin-stack">
          <Card title="روش‌های ورود مجاز">
            <div className="admin-stack-sm">
              {authSettingsMock.allowedIdentifiers.map((i) => (
                <div key={i.id} className="admin-row-between">
                  <span style={{ fontSize: 13 }}>{i.label}</span>
                  <Switch on={i.enabled} onChange={() => {}} />
                </div>
              ))}
            </div>
          </Card>
          <Card title="قوانین رمز عبور">
            <div className="admin-grid-3">
              <Field label="حداقل طول (ورود)"><input className="admin-input" type="number" defaultValue={authSettingsMock.passwordMinLengthSignin} dir="ltr" /></Field>
              <Field label="حداقل طول (ثبت‌نام)"><input className="admin-input" type="number" defaultValue={authSettingsMock.passwordMinLengthSignup} dir="ltr" /></Field>
              <Field label="حداقل طول (بازیابی)"><input className="admin-input" type="number" defaultValue={authSettingsMock.passwordMinLengthReset} dir="ltr" /></Field>
            </div>
          </Card>
          <Card title="کد یکبار مصرف (OTP)">
            <div className="admin-grid-2">
              <Field label="طول کد"><input className="admin-input" type="number" defaultValue={authSettingsMock.otpLength} dir="ltr" /></Field>
              <Field label="تأخیر ارسال مجدد (ثانیه)"><input className="admin-input" type="number" defaultValue={authSettingsMock.otpResendCooldownSec} dir="ltr" /></Field>
            </div>
          </Card>
          <Card title="سایر">
            <div className="admin-row-between"><span style={{ fontSize: 13 }}>«مرا به خاطر بسپار» به‌صورت پیش‌فرض روشن</span><Switch on={authSettingsMock.rememberMeDefault} onChange={() => {}} /></div>
            <div className="admin-row-between"><span style={{ fontSize: 13 }}>الزام تأیید شرایط</span><Switch on={authSettingsMock.requireAgreement} onChange={() => {}} /></div>
          </Card>
        </div>
      )}

      {tab === "signin" && (
        <Card title="متن‌های صفحه ورود">
          <Field label="Eyebrow"><input className="admin-input" defaultValue={authSettingsMock.signinPage.eyebrow} /></Field>
          <Field label="عنوان"><input className="admin-input" defaultValue={authSettingsMock.signinPage.title} /></Field>
          <Field label="زیرعنوان"><textarea className="admin-textarea" defaultValue={authSettingsMock.signinPage.subtitle} rows={2} /></Field>
        </Card>
      )}

      {tab === "signup" && (
        <Card title="متن‌های صفحه ثبت‌نام">
          <Field label="Eyebrow"><input className="admin-input" defaultValue={authSettingsMock.signupPage.eyebrow} /></Field>
          <Field label="عنوان"><input className="admin-input" defaultValue={authSettingsMock.signupPage.title} /></Field>
          <Field label="زیرعنوان"><textarea className="admin-textarea" defaultValue={authSettingsMock.signupPage.subtitle} rows={2} /></Field>
        </Card>
      )}

      {tab === "forgot" && (
        <Card title="متن‌های صفحه بازیابی رمز">
          <Field label="Eyebrow"><input className="admin-input" defaultValue={authSettingsMock.forgotPasswordPage.eyebrow} /></Field>
          <Field label="عنوان"><input className="admin-input" defaultValue={authSettingsMock.forgotPasswordPage.title} /></Field>
          <Field label="زیرعنوان"><textarea className="admin-textarea" defaultValue={authSettingsMock.forgotPasswordPage.subtitle} rows={2} /></Field>
        </Card>
      )}

      <div className="admin-muted" style={{ textAlign: "center", padding: "1rem" }}>
        {faNum(authSettingsMock.otpLength)} رقمی
      </div>
    </>
  );
}
