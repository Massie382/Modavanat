/**
 * Edge-safe NextAuth config — used by `src/middleware.ts`.
 *
 * This file MUST NOT import `db/client` (which uses `process.cwd()`
 * to locate the PGlite data dir; that Node API isn't available in
 * the Edge Runtime). The database adapter is added in `src/auth.ts`
 * (server-only) instead.
 *
 * The middleware uses only the JWT-cookie form of the session — no
 * DB lookup per request — so admin/account route guards are fast
 * and work even on cold DB connections.
 */

import type { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authConfig = {
  // JWT strategy — middleware checks the JWT cookie without hitting
  // the DB. The server-side `src/auth.ts` extends this with the
  // Drizzle adapter for token persistence; both share the same JWT.
  session: { strategy: "jwt" },
  trustHost: true,
  useSecureCookies: process.env.NODE_ENV === "production",
  providers: [
    // Providers list here is just for the middleware to know which
    // provider IDs to look for in the JWT. The full provider config
    // (with `authorize`, `sendVerificationRequest`, etc.) lives in
    // `src/auth.ts`.
    CredentialsProvider({ name: "ایمیل و گذرواژه" }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On sign-in, `user` is populated with the returned value from
      // `authorize`. Stash its role + id into the JWT so middleware
      // can read them without a DB call.
      if (user) {
        token.role = (user as { role?: string }).role ?? "user";
        token.uid = (user as { id?: string }).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string; role?: string }).id = token.uid as string;
        (session.user as { id?: string; role?: string }).role =
          (token.role as string) ?? "user";
      }
      return session;
    },
  },
  pages: { signIn: "/signin" },
} satisfies NextAuthConfig;
