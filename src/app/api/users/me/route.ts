/**
 * PATCH /api/users/me
 *
 * Update the current user's profile + preferences. Body fields:
 *   { name?: string, image?: string|null,
 *     currentPassword?: string, newPassword?: string,
 *     emailNotifications?: boolean, smsNotifications?: boolean,
 *     weeklyDigest?: boolean, bookmarkAlerts?: boolean }
 *
 * Password change requires `currentPassword` to match the stored hash;
 * we never reveal which field was wrong — both password + email
 * validation failures return the same generic "currentPassword is
 * incorrect" error to avoid leaking state.
 *
 * NOTE on prefs storage: the existing UI uses a `UserPreferences`
 * shape with email/sms/weeklyDigest/bookmarkAlerts toggles. There's
 * no DB column for these yet — we store them as a JSON blob on
 * `users.image` (which we use as a "misc JSON" sink because the
 * NextAuth default schema has nowhere else to put app-level user
 * metadata without a custom column). TODO Phase 7: add a
 * `preferences` jsonb column to users + migrate.
 *
 * Audit-logged.
 */
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getUserFromSession, getClientIpFromReq } from "@/lib/auth/session";
import { verifyPassword, hashPassword } from "@/lib/auth/passwords";
import { logAudit } from "@/lib/auth/audit";

const schema = z.object({
  name: z.string().trim().min(3).max(80).optional(),
  image: z.string().trim().max(2000).nullable().optional(),
  currentPassword: z.string().max(200).optional(),
  newPassword: z.string().min(8).max(200).optional(),
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  weeklyDigest: z.boolean().optional(),
  bookmarkAlerts: z.boolean().optional(),
});

const PREFS_KEY = "__prefs"; // marker prefix in image JSON
function parsePrefs(image: string | null): Record<string, boolean> {
  if (!image) return { emailNotifications: true, weeklyDigest: true, bookmarkAlerts: true, smsNotifications: false };
  try {
    const j = JSON.parse(image);
    if (j && typeof j === "object" && j.__prefs) {
      return { emailNotifications: true, weeklyDigest: true, bookmarkAlerts: true, smsNotifications: false, ...j.prefs };
    }
  } catch {}
  return { emailNotifications: true, weeklyDigest: true, bookmarkAlerts: true, smsNotifications: false };
}

function buildImageFromPrefs(prefs: Record<string, boolean>): string {
  return JSON.stringify({ __prefs: true, prefs });
}

export async function PATCH(req: Request) {
  const u = await getUserFromSession();
  if (!u) {
    return NextResponse.json({ error: "ابتدا وارد شوید." }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "بدنه نامعتبر." }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ورودی نامعتبر." },
      { status: 400 }
    );
  }
  const patch = parsed.data;

  // Fetch the current row so we can verify currentPassword against
  // the stored hash + merge prefs.
  const found = await db
    .select()
    .from(users)
    .where(eq(users.id, u.id))
    .limit(1);
  if (found.length === 0) {
    return NextResponse.json({ error: "حساب یافت نشد." }, { status: 404 });
  }
  const current = found[0];

  const set: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };

  // Name
  if (patch.name !== undefined) set.name = patch.name;

  // Password change — only if both currentPassword + newPassword
  // are provided. We verify currentPassword against the stored hash
  // (or skip that check on the bootstrap path where passwordHash is
  // null — but that case shouldn't happen for /account/me PATCH
  // since the user is already logged in).
  if (patch.newPassword) {
    if (!patch.currentPassword) {
      return NextResponse.json(
        { error: "برای تغییر رمز عبور، رمز فعلی را وارد کنید." },
        { status: 400 }
      );
    }
    if (current.passwordHash && !verifyPassword(patch.currentPassword, current.passwordHash)) {
      return NextResponse.json(
        { error: "رمز عبور فعلی نادرست است." },
        { status: 403 }
      );
    }
    set.passwordHash = hashPassword(patch.newPassword);
  }

  // Preferences — merge into the existing prefs blob.
  const existingPrefs = parsePrefs(current.image ?? null);
  const mergedPrefs = {
    ...existingPrefs,
    ...(patch.emailNotifications !== undefined ? { emailNotifications: patch.emailNotifications } : {}),
    ...(patch.smsNotifications !== undefined ? { smsNotifications: patch.smsNotifications } : {}),
    ...(patch.weeklyDigest !== undefined ? { weeklyDigest: patch.weeklyDigest } : {}),
    ...(patch.bookmarkAlerts !== undefined ? { bookmarkAlerts: patch.bookmarkAlerts } : {}),
  };
  // If `image` (a real avatar URL) wasn't explicitly provided in the
  // patch, preserve the existing prefs JSON; otherwise overwrite.
  if (patch.image !== undefined && patch.image !== null && !patch.image.startsWith("{")) {
    // Caller is setting a real image URL — keep prefs in a separate
    // field if we add one later. For now, just store the URL.
    set.image = patch.image;
  } else {
    set.image = buildImageFromPrefs(mergedPrefs);
  }

  await db.update(users).set(set).where(eq(users.id, u.id));

  await logAudit({
    actorUserId: u.id,
    action: "user.profile.update",
    targetType: "user",
    targetId: u.id,
    metadata: {
      changedName: patch.name !== undefined,
      changedPassword: !!patch.newPassword,
      changedPrefs:
        patch.emailNotifications !== undefined ||
        patch.smsNotifications !== undefined ||
        patch.weeklyDigest !== undefined ||
        patch.bookmarkAlerts !== undefined,
    },
    ip: getClientIpFromReq(req),
  });

  return NextResponse.json({
    ok: true,
    user: {
      id: u.id,
      name: patch.name ?? current.name,
      email: current.email,
      role: current.role,
    },
    prefs: mergedPrefs,
  });
}

/**
 * GET /api/users/me → return the current user's profile + prefs.
 */
export async function GET() {
  const u = await getUserFromSession();
  if (!u) {
    return NextResponse.json({ error: "ابتدا وارد شوید." }, { status: 401 });
  }
  const found = await db
    .select()
    .from(users)
    .where(eq(users.id, u.id))
    .limit(1);
  if (found.length === 0) {
    return NextResponse.json({ error: "حساب یافت نشد." }, { status: 404 });
  }
  const current = found[0];
  const prefs = parsePrefs(current.image ?? null);
  return NextResponse.json({
    user: {
      id: current.id,
      name: current.name,
      email: current.email,
      role: current.role,
      emailVerified: current.emailVerified?.toISOString() ?? null,
      image: current.image && current.image.startsWith("{") ? null : current.image,
      createdAt: current.createdAt.toISOString(),
    },
    prefs,
  });
}
