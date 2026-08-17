"use client";

import { useState } from "react";
import { PageHead, Card, Badge, faNum, statusBadgeVariant } from "@/components/admin/primitives";
import { useToast } from "@/hooks/use-toast";
import type { AdminUser } from "@/lib/queries/users";

interface AdminsClientProps {
  users: AdminUser[];
  currentUser: { id: string; role: string };
}

const ROLE_LABELS: Record<string, string> = {
  user: "کاربر",
  admin: "مدیر",
  "super-admin": "مدیر ارشد",
};

function formatDate(d: Date | string | null): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("fa-IR");
}

/**
 * /admin/admins client component.
 *
 * Renders the user list and handles create/edit/delete via fetch to
 * /api/admin/users. Toast feedback for every action.
 */
export function AdminsClient({ users, currentUser }: AdminsClientProps) {
  const { toast } = useToast();
  const [userList, setUserList] = useState<AdminUser[]>(users);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // ── Create new user ───────────────────────────────────────────────
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<"user" | "admin" | "super-admin">("user");
  const [newPassword, setNewPassword] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      toast({ title: "خطا", description: "ایمیل معتبر وارد کنید" });
      return;
    }
    if (newPassword && newPassword.length < 8) {
      toast({ title: "خطا", description: "گذرواژه حداقل ۸ کاراکتر باشد" });
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail,
          name: newName,
          role: newRole,
          password: newPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      setUserList((prev) => [...prev, data.user]);
      toast({ title: "✓ ایجاد شد", description: `کاربر ${newEmail} ساخته شد` });
      setNewEmail("");
      setNewName("");
      setNewPassword("");
      setNewRole("user");
      setShowCreateForm(false);
    } catch (err) {
      toast({
        title: "خطا در ایجاد",
        description: err instanceof Error ? err.message : "خطای ناشناخته",
      });
    } finally {
      setCreating(false);
    }
  }

  // ── Delete user ────────────────────────────────────────────────────
  async function handleDelete(id: string, email: string) {
    if (!confirm(`حذف کاربر «${email}»؟ این عمل قابل بازگشت نیست.`)) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed");
      }
      setUserList((prev) => prev.filter((u) => u.id !== id));
      toast({ title: "✓ حذف شد", description: `کاربر ${email} حذف شد` });
    } catch (err) {
      toast({
        title: "خطا در حذف",
        description: err instanceof Error ? err.message : "خطای ناشناخته",
      });
    }
  }

  // ── Update role ────────────────────────────────────────────────────
  async function handleRoleChange(id: string, role: "user" | "admin" | "super-admin") {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      setUserList((prev) => prev.map((u) => (u.id === id ? data.user : u)));
      toast({ title: "✓ به‌روزرسانی شد", description: `نقش به «${ROLE_LABELS[role]}» تغییر یافت` });
    } catch (err) {
      toast({
        title: "خطا",
        description: err instanceof Error ? err.message : "خطای ناشناخته",
      });
    }
  }

  // ── Reset password ────────────────────────────────────────────────
  async function handleResetPassword(id: string, email: string) {
    const pw = prompt(`گذرواژه جدید برای ${email} (حداقل ۸ کاراکتر):`);
    if (!pw) return;
    if (pw.length < 8) {
      toast({ title: "خطا", description: "گذرواژه حداقل ۸ کاراکتر باشد" });
      return;
    }
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed");
      }
      toast({ title: "✓ گذرواژه تغییر کرد", description: `برای ${email}` });
    } catch (err) {
      toast({
        title: "خطا",
        description: err instanceof Error ? err.message : "خطای ناشناخته",
      });
    }
  }

  const canCreateSuperAdmin = currentUser.role === "super-admin";

  return (
    <>
      <PageHead
        title="مدیران سیستم"
        subtitle={`${faNum(userList.length)} کاربر ثبت‌شده`}
        actions={
          <button
            className="admin-btn admin-btn-primary"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            + افزودن کاربر
          </button>
        }
      />

      {showCreateForm && (
        <Card title="ایجاد کاربر جدید">
          <form onSubmit={handleCreate} className="admin-stack-sm">
            <div className="admin-grid-2">
              <label className="admin-field">
                <span>ایمیل</span>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  placeholder="user@example.com"
                  className="admin-input"
                />
              </label>
              <label className="admin-field">
                <span>نام (اختیاری)</span>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="نام کامل"
                  className="admin-input"
                />
              </label>
            </div>
            <div className="admin-grid-2">
              <label className="admin-field">
                <span>نقش</span>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as typeof newRole)}
                  className="admin-input"
                >
                  <option value="user">کاربر</option>
                  <option value="admin">مدیر</option>
                  {canCreateSuperAdmin && (
                    <option value="super-admin">مدیر ارشد</option>
                  )}
                </select>
              </label>
              <label className="admin-field">
                <span>گذرواژه (اختیاری)</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="≥ ۸ کاراکتر — یا خالی بگذارید تا کاربر هنگام ورود تنظیم کند"
                  className="admin-input"
                />
              </label>
            </div>
            <div className="admin-row-gap">
              <button
                type="submit"
                disabled={creating}
                className="admin-btn admin-btn-primary"
              >
                {creating ? "در حال ایجاد..." : "ایجاد کاربر"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="admin-btn admin-btn-ghost"
              >
                لغو
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card title="فهرست کاربران" tight>
        <table className="admin-table">
          <thead>
            <tr>
              <th>کاربر</th>
              <th>نقش</th>
              <th>گذرواژه</th>
              <th>تاریخ ایجاد</th>
              <th className="col-narrow">عمل</th>
            </tr>
          </thead>
          <tbody>
            {userList.length === 0 ? (
              <tr>
                <td colSpan={5} className="admin-muted" style={{ textAlign: "center", padding: "2rem" }}>
                  هنوز کاربری ثبت نشده است.
                </td>
              </tr>
            ) : (
              userList.map((u) => {
                const isSelf = u.id === currentUser.id;
                const isSuperAdmin = u.role === "super-admin";
                const canEditRole = !isSelf && (!isSuperAdmin || canCreateSuperAdmin);
                return (
                  <tr key={u.id}>
                    <td>
                      <div className="admin-row">
                        <span
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            backgroundColor: "#e0e7ff",
                            color: "#1a1a1a",
                            display: "grid",
                            placeItems: "center",
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {(u.name || u.email).charAt(0)}
                        </span>
                        <div>
                          <div style={{ fontWeight: 500 }}>
                            {u.name || "—"}
                            {isSelf && (
                              <span className="admin-muted" style={{ marginRight: 6 }}>
                                (شما)
                              </span>
                            )}
                          </div>
                          <div className="admin-muted admin-mono">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <select
                        value={u.role}
                        disabled={!canEditRole}
                        onChange={(e) =>
                          handleRoleChange(
                            u.id,
                            e.target.value as "user" | "admin" | "super-admin"
                          )
                        }
                        className="admin-input"
                        style={{ width: "auto" }}
                      >
                        <option value="user">کاربر</option>
                        <option value="admin">مدیر</option>
                        {(canCreateSuperAdmin || isSuperAdmin) && (
                          <option value="super-admin">مدیر ارشد</option>
                        )}
                      </select>
                    </td>
                    <td>
                      <Badge variant={u.passwordHash ? "success" : "neutral"}>
                        {u.passwordHash ? "تنظیم‌شده" : "بدون گذرواژه"}
                      </Badge>
                    </td>
                    <td>
                      <span className="admin-muted">{formatDate(u.createdAt)}</span>
                    </td>
                    <td className="col-narrow">
                      <button
                        className="admin-btn admin-btn-sm admin-btn-ghost"
                        onClick={() => handleResetPassword(u.id, u.email)}
                      >
                        گذرواژه
                      </button>
                      {!isSelf && (
                        <button
                          className="admin-btn admin-btn-sm admin-btn-ghost"
                          onClick={() => handleDelete(u.id, u.email)}
                          style={{ marginRight: 4, color: "var(--admin-danger)" }}
                        >
                          حذف
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>
    </>
  );
}
