/**
 * NextAuth v5 catch-all route handler. The handlers are imported from
 * `@/auth` (the NextAuth config) and re-exported as GET/POST.
 *
 * Path: /api/auth/[...nextauth]
 */
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
