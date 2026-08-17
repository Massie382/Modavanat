import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listUsers, type AdminUser } from "@/lib/queries/users";
import { AdminsClient } from "./AdminsClient";

/**
 * /admin/admins — server component for user management.
 *
 * Fetches the real user list from the DB and passes to the client
 * component for rendering + interactions. Auth is enforced by
 * middleware (only admin/super-admin can reach /admin/*) AND
 * re-verified here for defense-in-depth.
 */

export const dynamic = "force-dynamic";

export default async function AdminsPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin?callbackUrl=/admin/admins");
  if (session.user.role !== "admin" && session.user.role !== "super-admin") {
    redirect("/403");
  }

  const users = await listUsers();
  // Strip password_hash before passing to client (defense in depth).
  const safeUsers: AdminUser[] = users.map((u) => ({
    ...u,
    passwordHash: u.passwordHash ? "[set]" : null,
  }));

  const currentUser = {
    id: session.user.id,
    role: session.user.role,
  };

  return <AdminsClient users={safeUsers} currentUser={currentUser} />;
}
