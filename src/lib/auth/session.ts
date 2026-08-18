/**
 * Server-side helper: get the authenticated user from the NextAuth
 * session in a Next.js Route Handler (app/api).
 *
 * Returns:
 *   { id, email, name, role, image } | null
 *
 * Usage:
 *   const u = await getUserFromSession();
 *   if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
 *
 * For admin-only routes, use `getAdminUser()` instead — it returns null
 * for non-admin users too.
 */

import { auth } from "@/auth";

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  image?: string | null;
}

export async function getUserFromSession(): Promise<AuthUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name,
    role: session.user.role ?? "user",
    image: session.user.image,
  };
}

export async function getAdminUser(): Promise<AuthUser | null> {
  const u = await getUserFromSession();
  if (!u) return null;
  if (u.role !== "admin" && u.role !== "super-admin") return null;
  return u;
}

/**
 * Extract the client IP from a Next.js Request — same logic as in
 * rate-limit.ts but exported here so API routes can reach it without
 * pulling the rate-limit module (which is mostly for auth flows).
 */
export function getClientIpFromReq(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "0.0.0.0";
}
