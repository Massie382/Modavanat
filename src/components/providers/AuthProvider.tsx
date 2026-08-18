"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

/**
 * Client-side NextAuth SessionProvider wrapper. Lives in a client
 * component (this file) so it can be imported by the root layout
 * (which is a server component). Children get access to `useSession`
 * from any client component.
 *
 * We do NOT pass a session prop — NextAuth v5 fetches the session
 * from /api/auth/session on mount, which works because the JWT
 * cookie is sent automatically with the fetch.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
