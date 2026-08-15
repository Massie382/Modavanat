"use client";

import { PageHead, Card, Badge, Field, Switch, faNum, statusBadgeVariant } from "@/components/admin/primitives";
import { useToast } from "@/hooks/use-toast";
import { defaultAdminUsers, roleLabels, rolePermissions, type AdminRole } from "@/lib/admin-data";

export default function AdminsPage() {
  const { toast } = useToast();
  return (
    <>
      <PageHead
        title="مدیران سیستم"
        subtitle={`${faNum(defaultAdminUsers.length)} مدیر با دسترسی به پنل`}
        actions={<button className="admin-btn admin-btn-primary" onClick={() => toast({ title: "ایجاد", description: "باز کردن فرم ایجاد..." })}>+ دعوت مدیر</button>}
      />

      <div className="admin-grid-2">
        <Card title="فهرست مدیران" tight>
          <table className="admin-table">
            <thead>
              <tr><th>مدیر</th><th>نقش</th><th>وضعیت</th><th>آخرین ورود</th><th className="col-narrow">عمل</th></tr>
            </thead>
            <tbody>
              {defaultAdminUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="admin-row">
                      <span style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: u.avatarColor, color: "#1a1a1a", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700 }}>{u.displayName.charAt(0)}</span>
                      <div>
                        <div style={{ fontWeight: 500 }}>{u.displayName}</div>
                        <div className="admin-muted admin-mono">@{u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td><Badge variant={u.role === "super-admin" ? "accent" : u.role === "editor" ? "info" : "neutral"}>{roleLabels[u.role as AdminRole]}</Badge></td>
                  <td><Badge variant={statusBadgeVariant(u.status)}>{u.status === "active" ? "فعال" : u.status === "invited" ? "دعوت‌شده" : "معلق"}</Badge></td>
                  <td><span className="admin-muted">{u.lastLogin}</span></td>
                  <td className="col-narrow">
                    <button className="admin-btn admin-btn-sm admin-btn-ghost" onClick={() => toast({ title: "ویرایش", description: "باز کردن فرم ویرایش..." })}>ویرایش</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <div className="admin-stack">
          <Card title="نقش‌ها و دسترسی‌ها">
            <div className="admin-stack-sm">
              {(Object.keys(roleLabels) as AdminRole[]).map((role) => (
                <div key={role} style={{ border: "1px solid var(--admin-border)", borderRadius: 4, padding: "0.75rem" }}>
                  <div className="admin-row" style={{ marginBottom: "0.5rem" }}>
                    <Badge variant={role === "super-admin" ? "accent" : "neutral"}>{roleLabels[role]}</Badge>
                    <code className="admin-mono admin-muted">{role}</code>
                  </div>
                  <div className="admin-wrap">
                    {rolePermissions[role].map((p) => <Badge key={p} variant="neutral">{p}</Badge>)}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="افزودن مدیر جدید">
            <Field label="نام نمایشی"><input className="admin-input" /></Field>
            <Field label="ایمیل"><input className="admin-input" dir="ltr" /></Field>
            <Field label="نقش">
              <select className="admin-select">
                {(Object.keys(roleLabels) as AdminRole[]).map((r) => <option key={r} value={r}>{roleLabels[r]}</option>)}
              </select>
            </Field>
            <button className="admin-btn admin-btn-primary" onClick={() => toast({ title: "ایجاد", description: "باز کردن فرم ایجاد..." })}>ارسال دعوت</button>
          </Card>
        </div>
      </div>
    </>
  );
}
