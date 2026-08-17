/**
 * GET /api/notifications/sse — Server-Sent Events endpoint.
 *
 * Clients connect with `new EventSource('/api/notifications/sse')`
 * and receive real-time notifications as JSON-encoded events.
 *
 * Auth:
 *   - Optional. Anonymous users still get broadcast events (e.g.
 *     "new law published"). Scoped events (e.g. "your bookmark was
 *     updated by another device") require a session — pass the
 *     NextAuth cookie in the request and the SSE handler will
 *     filter events by `scope === userId`.
 *
 * Reliability:
 *   - Sends a `:` comment every 15 seconds as a keepalive so the
 *     browser doesn't time out the connection.
 *   - On disconnect (client closes), the subscriber is removed.
 *   - This is an in-memory pub-sub — see src/lib/notifications/pubsub.ts
 *     for limitations and migration path.
 */

import { NextRequest } from "next/server";
import { subscribe, type NotificationEvent } from "@/lib/notifications/pubsub";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";
// SSE must not be buffered by any proxy — disable all compression.
export const fetchCache = "force-no-store";

export async function GET(req: NextRequest) {
  // Resolve current user (if any) so we can deliver scoped events.
  // We don't require auth — anonymous users still get broadcasts.
  const session = await auth();
  const userId = session?.user?.id;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // Initial hello — client can confirm connection is live.
      controller.enqueue(
        encoder.encode(`event: hello\ndata: ${JSON.stringify({ ok: true, userId: userId ?? null })}\n\n`)
      );

      // Subscribe to events — filter by scope if user is signed in.
      const unsubscribe = subscribe((event: NotificationEvent) => {
        // Deliver events that:
        //   - Have no scope (broadcast), OR
        //   - Have scope === current user id
        if (event.scope && event.scope !== userId) return;
        try {
          controller.enqueue(
            encoder.encode(
              `id: ${event.id}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`
            )
          );
        } catch {
          // Controller closed — unsubscribe will be called by cancel().
        }
      });

      // Keepalive ping every 15 seconds — SSE comments start with `:`
      // and are ignored by EventSource but reset the connection timer.
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: keepalive ${Date.now()}\n\n`));
        } catch {
          // ignore — controller closed
        }
      }, 15000);

      // Cleanup on cancel (client disconnect)
      req.signal.addEventListener("abort", () => {
        clearInterval(keepalive);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
    cancel() {
      // Controller was cancelled by the runtime (server shutdown).
      // The abort listener above will run cleanup; nothing else to do.
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // disables nginx buffering
    },
  });
}
