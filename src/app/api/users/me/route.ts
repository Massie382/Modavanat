/**
 * /api/users/me
 *   GET    → current user's profile + preferences
 *   PATCH  → update profile (name, password, preferences)
 *   DELETE → permanently delete the account (requires currentPassword
 *           for users who have a passwordHash)
 *
 * Phase 8: prefs now live in `users.preferences` (jsonb column).
 * Previously we stashed them as JSON inside `users.image` (the
 * NextAuth default schema had nowhere else). The 0005_phase8.sql
 * migration back-fills the new column from those blobs and NULLs
 * the image column for affected rows, so image is now reserved for
 * real avatar URLs only.
 *
 * All paths audit-logged.
 */
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getUserFromSession, getClientIpFromReq } from "@/lib/auth/session";
import { verifyPassword, hashPassword } from "@/lib/auth/passwords";
import { logAudit } from "@/lib/auth/audit";

// ── Defaults ──────────────────────────────────────────────────────
interface Prefs {
  emailNotifications: boolean;
  smsNotifications: boolean;
  weeklyDigest: boolean;
  bookmarkAlerts: boolean;
  [key: string]: boolean;
}

const DEFAULT_PREFS: Prefs = {
  emailNotifications: true,
  weeklyDigest: true,
  bookmarkAlerts: true,
  smsNotifications: false,
};

function parsePrefs(raw: unknown): Prefs {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...DEFAULT_PREFS };
  }
  return { ...DEFAULT_PREFS, ...(raw as Record<string, boolean>) };
}

// ── Schemas ───────────────────────────────────────────────────────
const patchSchema = z.object({
  name: z.string().trim().min(3).max(80).optional(),
  image: z.string().trim().max(2000).nullable().optional(),
  currentPassword: z.string().max(200).optional(),
  newPassword: z.string().min(8).max(200).optional(),
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  weeklyDigest: z.boolean().optional(),
  bookmarkAlerts: z.boolean().optional(),
});

const deleteSchema = z.object({
  currentPassword: z.string().max(200).optional(),
});

// ── PATCH ─────────────────────────────────────────────────────────
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
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ورودی نامعتبر." },
      { status: 400 }
    );
  }
  const patch = parsed.data;

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

  // Real avatar URL — only set if it's actually a URL, not a prefs blob.
  // (After Phase 8, the image column should never hold prefs again,
  // but we keep the guard for safety in case any legacy data slipped
  // through.)
  if (patch.image !== undefined && patch.image !== null && !patch.image.startsWith("{")) {
    set.image = patch.image;
  } else if (patch.image === null) {
    set.image = null;
  }

  // Password change — verify currentPassword against stored hash.
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

  // Preferences — merge into the existing preferences jsonb column.
  const existingPrefs = parsePrefs(current.preferences);
  const mergedPrefs: Prefs = {
    ...existingPrefs,
    ...(patch.emailNotifications !== undefined ? { emailNotifications: patch.emailNotifications } : {}),
    ...(patch.smsNotifications !== undefined ? { smsNotifications: patch.smsNotifications } : {}),
    ...(patch.weeklyDigest !== undefined ? { weeklyDigest: patch.weeklyDigest } : {}),
    ...(patch.bookmarkAlerts !== undefined ? { bookmarkAlerts: patch.bookmarkAlerts } : {}),
  };
  set.preferences = mergedPrefs;

  await db.update(users).set(set).where(eq(users.id, u.id));

  await logAudit({
    actorUserId: u.id,
    action: "user.profile.update",
    targetType: "user",
    targetId: u.id,
    metadata: {
      changedName: patch.name !== undefined,
      changedPassword: !!patch.newPassword,
      changedImage: patch.image !== undefined,
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

// ── GET ───────────────────────────────────────────────────────────
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
  const prefs = parsePrefs(current.preferences);
  return NextResponse.json({
    user: {
      id: current.id,
      name: current.name,
      email: current.email,
      role: current.role,
      emailVerified: current.emailVerified?.toISOString() ?? null,
      image: current.image,
      createdAt: current.createdAt.toISOString(),
    },
    prefs,
  });
}

// ── DELETE ────────────────────────────────────────────────────────
//
// Permanent account deletion. Requires `currentPassword` for users
// who have a passwordHash — magic-link / OAuth users without a hash
// can delete without it (they'd need to be signed in, which proves
// control of the email). Cascade rules on the schema take down all
// dependent rows (bookmarks, tickets, ticket_messages, purchases,
// sessions, accounts, tokens).
//
// We audit-log BEFORE deleting the row, because once the user is
// gone, the FK from audit_log.actor_user_id (ON DELETE SET NULL)
// would orphan the entry. Logging first ensures the actor link is
// preserved for the audit trail.
export async function DELETE(req: Request) {
  const u = await getUserFromSession();
  if (!u) {
    return NextResponse.json({ error: "ابتدا وارد شوید." }, { status: 401 });
  }
  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    // Allow empty body — magic-link users without passwordHash can
    // delete without sending any payload.
  }
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ورودی نامعتبر." },
      { status: 400 }
    );
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

  // If the user has a password hash, require a matching currentPassword.
  // This prevents a stolen session cookie alone from being enough to
  // delete the account.
  if (current.passwordHash) {
    if (!parsed.data.currentPassword) {
      return NextResponse.json(
        { error: "برای حذف حساب، رمز عبور فعلی را وارد کنید." },
        { status: 400 }
      );
    }
    if (!verifyPassword(parsed.data.currentPassword, current.passwordHash)) {
      return NextResponse.json(
        { error: "رمز عبور فعلی نادرست است." },
        { status: 403 }
      );
    }
  }

  // Audit-log BEFORE deletion so actor_user_id FK is still valid.
  // Capture email + name in metadata since those columns will be
  // gone after the cascade.
  await logAudit({
    actorUserId: u.id,
    action: "user.account.delete",
    targetType: "user",
    targetId: u.id,
    metadata: {
      email: current.email,
      name: current.name,
      hadPassword: !!current.passwordHash,
    },
    ip: getClientIpFromReq(req),
  });

  await db.delete(users).where(eq(users.id, u.id));

  return NextResponse.json({ ok: true });
}
