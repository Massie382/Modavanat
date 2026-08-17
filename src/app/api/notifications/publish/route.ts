/**
 * POST /api/notifications/publish — admin-only endpoint to broadcast
 * a notification event to all connected SSE clients.
 *
 * Body:
 *   { type: "amendment"|"bookmark"|"system"|"law"|"reference",
 *     title: string,
 *     body?: string,
 *     url?: string,
 *     scope?: string }
 *
 * Returns 201 with the event id on success.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/admin-guard";
import { publish, type NotificationEvent } from "@/lib/notifications/pubsub";

export const dynamic = "force-dynamic";

const VALID_TYPES: NotificationEvent["type"][] = [
  "amendment",
  "bookmark",
  "system",
  "law",
  "reference",
];

export async function POST(req: NextRequest) {
  const guard = await getAdminUser();
  if (!guard.ok) return guard.response;

  let body: Partial<NotificationEvent>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "bad_request", message: "Invalid JSON body" },
      { status: 400 }
    );
  }
  if (!body.title || !body.type) {
    return NextResponse.json(
      { error: "bad_request", message: "title and type are required" },
      { status: 400 }
    );
  }
  if (!VALID_TYPES.includes(body.type)) {
    return NextResponse.json(
      { error: "bad_request", message: `Invalid type: ${body.type}` },
      { status: 400 }
    );
  }

  const event = publish({
    type: body.type,
    title: body.title,
    body: body.body,
    url: body.url,
    scope: body.scope,
  });

  return NextResponse.json({ ok: true, id: event.id, timestamp: event.timestamp }, { status: 201 });
}
