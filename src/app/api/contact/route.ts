/**
 * POST /api/contact
 *
 * Public contact form submission — creates a ticket owned by a
 * synthetic "anonymous" user (a sentinel UUID) if the visitor isn't
 * signed in, otherwise attaches it to the current user.
 *
 * For simplicity, when there's no logged-in user, we still create a
 * ticket row with userId pointing at a sentinel. To make the FK
 * constraint happy, we ensure the sentinel user exists with a
 * one-time INSERT IGNORE.
 *
 * Body: { subject, category, body, email, name? }
 */
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { tickets, ticketMessages, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getUserFromSession, getClientIpFromReq } from "@/lib/auth/session";
import { logAudit } from "@/lib/auth/audit";

const schema = z.object({
  subject: z.string().trim().min(5).max(200),
  category: z.string().trim().min(1).max(80),
  body: z.string().trim().min(5).max(8000),
  email: z.string().trim().toLowerCase().email(),
  name: z.string().trim().min(2).max(80).optional(),
});

// Sentinel "guest" user — a fixed UUID we use for all anonymous
// contact-form tickets. Created once, then re-used.
const GUEST_USER_ID = "00000000-0000-0000-0000-000000000000";
async function ensureGuestUser() {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, GUEST_USER_ID))
    .limit(1);
  if (existing.length > 0) return;
  await db.insert(users).values({
    id: GUEST_USER_ID,
    email: "guest@modavanat.local",
    name: "کاربر مهمان",
    role: "user",
    passwordHash: null,
    emailVerified: new Date(),
  }).catch(() => {
    // Unique constraint race — fine, the user was just created by a
    // concurrent request.
  });
}

export async function POST(req: Request) {
  const u = await getUserFromSession();
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
  const { subject, category, body: text, email, name } = parsed.data;

  let ownerId: string;
  if (u) {
    ownerId = u.id;
  } else {
    await ensureGuestUser();
    ownerId = GUEST_USER_ID;
  }

  const ticketId = crypto.randomUUID();
  const messageId = crypto.randomUUID();
  const now = new Date();
  // The body of the first message embeds the visitor's email + name
  // so the admin can reply by email even for anonymous submissions.
  const messageBody = name
    ? `از: ${name} <${email}>\n\n${text}`
    : `از: ${email}\n\n${text}`;

  await db.transaction(async (tx) => {
    await tx.insert(tickets).values({
      id: ticketId,
      userId: ownerId,
      subject,
      category,
      status: "open",
      priority: "medium",
      lastReplyAt: now,
      lastReplyFrom: "user",
      createdAt: now,
      updatedAt: now,
    });
    await tx.insert(ticketMessages).values({
      id: messageId,
      ticketId,
      authorUserId: ownerId,
      fromRole: "user",
      body: messageBody,
      createdAt: now,
    });
  });
  await logAudit({
    actorUserId: u?.id ?? null,
    action: "user.contact_form.submit",
    targetType: "ticket",
    targetId: ticketId,
    metadata: { email, name: name ?? null },
    ip: getClientIpFromReq(req),
  });
  return NextResponse.json({ ok: true, id: ticketId }, { status: 201 });
}
