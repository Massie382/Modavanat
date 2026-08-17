/**
 * GET    /api/admin/users/[id] — get a single user by ID
 * PATCH  /api/admin/users/[id] — update name/role/password
 * DELETE /api/admin/users/[id] — delete a user
 *
 * All admin-only. Super-admin role required for:
 *   - PATCHing role to/from super-admin
 *   - DELETEing any super-admin
 *   - DELETEing yourself is forbidden (lockout protection)
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/admin-guard";
import { getUserById, updateUser, deleteUser, type AdminRole } from "@/lib/queries/users";

export const dynamic = "force-dynamic";

const VALID_ROLES: AdminRole[] = ["user", "admin", "super-admin"];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await getAdminUser();
  if (!guard.ok) return guard.response;
  const { id } = await params;
  const user = await getUserById(id);
  if (!user) {
    return NextResponse.json(
      { error: "not_found", message: `User ${id} not found` },
      { status: 404 }
    );
  }
  return NextResponse.json({
    user: { ...user, passwordHash: user.passwordHash ? "[set]" : null },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await getAdminUser();
  if (!guard.ok) return guard.response;
  const { id } = await params;

  let body: {
    name?: string;
    role?: string;
    password?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "bad_request", message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Check target user exists
  const existing = await getUserById(id);
  if (!existing) {
    return NextResponse.json(
      { error: "not_found", message: `User ${id} not found` },
      { status: 404 }
    );
  }

  // Role-change authorization:
  //   - Anyone who can be admin can edit their own name
  //   - Promoting/demoting super-admin role requires super-admin
  //   - Editing another super-admin's role requires super-admin
  const isSelf = guard.user.id === id;
  const wantsRoleChange =
    body.role !== undefined && body.role !== existing.role;
  const involvesSuperAdmin =
    existing.role === "super-admin" || body.role === "super-admin";
  if (wantsRoleChange && involvesSuperAdmin && guard.user.role !== "super-admin") {
    return NextResponse.json(
      { error: "forbidden", message: "Super-admin access required to change super-admin roles" },
      { status: 403 }
    );
  }
  if (body.role !== undefined && !VALID_ROLES.includes(body.role as AdminRole)) {
    return NextResponse.json(
      { error: "bad_request", message: `Invalid role: ${body.role}` },
      { status: 400 }
    );
  }
  if (body.password !== undefined && body.password.length < 8) {
    return NextResponse.json(
      { error: "bad_request", message: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  try {
    const updated = await updateUser(id, {
      name: body.name,
      role: body.role as AdminRole | undefined,
      password: body.password,
    });
    if (!updated) {
      return NextResponse.json(
        { error: "not_found", message: `User ${id} not found` },
        { status: 404 }
      );
    }
    return NextResponse.json({
      user: { ...updated, passwordHash: updated.passwordHash ? "[set]" : null },
    });
  } catch (err) {
    console.error(`[PATCH /api/admin/users/${id}] error:`, err);
    return NextResponse.json(
      { error: "internal_error", message: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await getAdminUser();
  if (!guard.ok) return guard.response;
  const { id } = await params;

  // Lockout protection: can't delete yourself.
  if (guard.user.id === id) {
    return NextResponse.json(
      { error: "forbidden", message: "You cannot delete your own account" },
      { status: 403 }
    );
  }

  // Check target user exists + check super-admin target
  const existing = await getUserById(id);
  if (!existing) {
    return NextResponse.json(
      { error: "not_found", message: `User ${id} not found` },
      { status: 404 }
    );
  }
  if (existing.role === "super-admin" && guard.user.role !== "super-admin") {
    return NextResponse.json(
      { error: "forbidden", message: "Super-admin access required to delete a super-admin" },
      { status: 403 }
    );
  }

  const deleted = await deleteUser(id);
  if (!deleted) {
    return NextResponse.json(
      { error: "not_found", message: `User ${id} not found` },
      { status: 404 }
    );
  }
  return NextResponse.json({ ok: true });
}
