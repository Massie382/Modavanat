/**
 * Admin auth helper — wraps NextAuth's `auth()` with role checks.
 * Used by /api/admin/* route handlers and admin server components.
 *
 * Returns the authenticated session's user, or null if not signed in.
 * Throws an HTTP-403-style error if the user lacks the admin role.
 */

import { auth } from "@/auth";
import type { NextResponse } from "next/server";

export interface AuthenticatedAdmin {
  id: string;
  email?: string | null;
  name?: string | null;
  role: string;
}

export async function getAdminUser(): Promise<
  | { ok: true; user: AuthenticatedAdmin }
  | { ok: false; response: NextResponse }
> {
  const session = await auth();
  if (!session?.user) {
    return {
      ok: false,
      response: Response.json(
        { error: "unauthorized", message: "Sign-in required" },
        { status: 401 }
      ) as NextResponse,
    };
  }
  if (session.user.role !== "admin" && session.user.role !== "super-admin") {
    return {
      ok: false,
      response: Response.json(
        { error: "forbidden", message: "Admin access required" },
        { status: 403 }
      ) as NextResponse,
    };
  }
  return {
    ok: true,
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
    },
  };
}
