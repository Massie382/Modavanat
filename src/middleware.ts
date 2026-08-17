/**
 * Middleware — protects /admin/* routes (role='admin' or 'super-admin')
 * and /account/* (any logged-in user). Uses the Edge-safe NextAuth v5
 * base config from `src/auth.config.ts` (NOT `src/auth.ts` which
 * imports the DB client and would pull `process.cwd()` into the Edge
 * bundle).
 *
 * Public routes (/, /browse, /search, /about, /law/*, /api/public/*)
 * are open to anonymous users.
 */

import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const ADMIN_PATHS = ["/admin"];
const ACCOUNT_PATHS = ["/account"];

export default auth((req) => {
  const path = req.nextUrl.pathname;
  const session = (req as unknown as { auth: unknown }).auth as
    | { user?: { role?: string } }
    | null;

  // Admin guard
  if (ADMIN_PATHS.some((p) => path.startsWith(p))) {
    if (!session?.user) {
      const url = new URL("/signin", req.nextUrl.origin);
      url.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(url);
    }
    if (session.user.role !== "admin" && session.user.role !== "super-admin") {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  // Account guard
  if (ACCOUNT_PATHS.some((p) => path.startsWith(p))) {
    if (!session?.user) {
      const url = new URL("/signin", req.nextUrl.origin);
      url.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
});

export const config = {
  // Run middleware on all routes except static assets and NextAuth's
  // own callback handler (otherwise the redirect loop would lock
  // users out of the signin page itself).
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)"],
};
