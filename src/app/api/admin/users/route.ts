/**
 * GET /api/admin/users — list all users (admin-only).
 * POST /api/admin/users — create a new user (super-admin-only, since
 *   only super-admins can grant admin role to others).
 *
 * Returns the user list WITHOUT password hashes — those are
 * intentionally omitted from the JSON response.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/admin-guard";
import { listUsers, createUser, type AdminRole } from "@/lib/queries/users";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await getAdminUser();
  if (!guard.ok) return guard.response;

  const users = await listUsers();
  // Strip passwordHash from response — never expose hashes to client.
  return NextResponse.json({
    users: users.map((u) => ({ ...u, passwordHash: u.passwordHash ? "[set]" : null })),
  });
}

const VALID_ROLES: AdminRole[] = ["user", "admin", "super-admin"];

export async function POST(req: NextRequest) {
  const guard = await getAdminUser();
  if (!guard.ok) return guard.response;
  // Only super-admins can create new users with admin role.
  if (guard.user.role !== "super-admin") {
    return NextResponse.json(
      { error: "forbidden", message: "Super-admin access required to create users" },
      { status: 403 }
    );
  }

  let body: {
    email?: string;
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

  if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return NextResponse.json(
      { error: "bad_request", message: "Valid email required" },
      { status: 400 }
    );
  }
  const role: AdminRole = (body.role as AdminRole) ?? "user";
  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json(
      { error: "bad_request", message: `Invalid role: ${body.role}` },
      { status: 400 }
    );
  }
  if (body.password && body.password.length < 8) {
    return NextResponse.json(
      { error: "bad_request", message: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  try {
    const created = await createUser({
      email: body.email,
      name: body.name,
      role,
      password: body.password,
    });
    return NextResponse.json(
      { user: { ...created, passwordHash: created.passwordHash ? "[set]" : null } },
      { status: 201 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return NextResponse.json(
        { error: "conflict", message: `Email ${body.email} already exists` },
        { status: 409 }
      );
    }
    console.error("[POST /api/admin/users] error:", err);
    return NextResponse.json(
      { error: "internal_error", message: "Failed to create user" },
      { status: 500 }
    );
  }
}
