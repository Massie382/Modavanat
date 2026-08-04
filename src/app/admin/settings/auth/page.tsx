"use client";

import { useState } from "react";
import { PageHead, Card, Field, Switch, Tabs } from "@/components/admin/primitives";
import { defaultAuthSettings } from "@/lib/admin-data";
import { faNum } from "@/components/admin/primitives";

export default function AuthSettingsPage() {
  const [tab, setTab] = useState("general");
  return (
    <>
      <PageHead title="تنظیمات احراز هویت" subtitle="ورود، ثبت‌نام و بازیابی رمز عبور" actions={<button className="admin-btn admin-btn-primary">ذخیره</button>} />
      <Tabs tabs={[{ id: "general", label: "عمومی" }, { id: "signin", label: "ورود" }, { id: "signup", label: "ثبت‌نام" }, { id: "forgot", label: "بازیابی رمز" }]} active={tab} onChange={setTab} />

      {tab === "general" && (
        <div className="admin-stack">
          <Card title="روش‌های ورود مجاز">
            <div className="admin-stack-sm">
              {defaultAuthSettings.allowedIdentifiers.map((i) => (
                <div key={i.id} className="admin-row-between">
                  <span style={{ fontSize: 13 }}>{i.label}</span>
                  <Switch on={i.enabled} onChange={() => {}} />
                </div>
              ))}
            </div>
          </Card>
          <Card title="قوانین رمز عبور">
            <div className="admin-grid-3">
              <Field label="حداقل طول (ورود)"><input className="admin-input" type="number" defaultValue={defaultAuthSettings.passwordMinLengthSignin} dir="ltr" /></Field>
              <Field label="حداقل طول (ثبت‌نام)"><input className="admin-input" type="number" defaultValue={defaultAuthSettings.passwordMinLengthSignup} dir="ltr" /></Field>
              <Field label="حداقل طول (بازیابی)"><input className="admin-input" type="number" defaultValue={defaultAuthSettings.passwordMinLengthReset} dir="ltr" /></Field>
            </div>
          </Card>
          <Card title="کد یکبار مصرف (OTP)">
            <div className="admin-grid-2">
              <Field label="طول کد"><input className="admin-input" type="number" defaultValue={defaultAuthSettings.otpLength} dir="ltr" /></Field>
              <Field label="تأخیر ارسال مجدد (ثانیه)"><input className="admin-input" type="number" defaultValue={defaultAuthSettings.otpResendCooldownSec} dir="ltr" /></Field>
            </div>
          </Card>
          <Card title="سایر">
            <div className="admin-row-between"><span style={{ fontSize: 13 }}>«مرا به خاطر بسپار» به‌صورت پیش‌فرض روشن</span><Switch on={defaultAuthSettings.rememberMeDefault} onChange={() => {}} /></div>
            <div className="admin-row-between"><span style={{ fontSize: 13 }}>الزام تأیید شرایط</span><Switch on={defaultAuthSettings.requireAgreement} onChange={() => {}} /></div>
          </Card>
        </div>
      )}

      {tab === "signin" && (
        <Card title="متن‌های صفحه ورود">
          <Field label="Eyebrow"><input className="admin-input" defaultValue={defaultAuthSettings.signinPage.eyebrow} /></Field>
          <Field label="عنوان"><input className="admin-input" defaultValue={defaultAuthSettings.signinPage.title} /></Field>
          <Field label="زیرعنوان"><textarea className="admin-textarea" defaultValue={defaultAuthSettings.signinPage.subtitle} rows={2} /></Field>
        </Card>
      )}

      {tab === "signup" && (
        <Card title="متن‌های صفحه ثبت‌نام">
          <Field label="Eyebrow"><input className="admin-input" defaultValue={defaultAuthSettings.signupPage.eyebrow} /></Field>
          <Field label="عنوان"><input className="admin-input" defaultValue={defaultAuthSettings.signupPage.title} /></Field>
          <Field label="زیرعنوان"><textarea className="admin-textarea" defaultValue={defaultAuthSettings.signupPage.subtitle} rows={2} /></Field>
        </Card>
      )}

      {tab === "forgot" && (
        <Card title="متن‌های صفحه بازیابی رمز">
          <Field label="Eyebrow"><input className="admin-input" defaultValue={defaultAuthSettings.forgotPasswordPage.eyebrow} /></Field>
          <Field label="عنوان"><input className="admin-input" defaultValue={defaultAuthSettings.forgotPasswordPage.title} /></Field>
          <Field label="زیرعنوان"><textarea className="admin-textarea" defaultValue={defaultAuthSettings.forgotPasswordPage.subtitle} rows={2} /></Field>
        </Card>
      )}
    </>
  );
}
