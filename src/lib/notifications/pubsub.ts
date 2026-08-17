/**
 * In-memory pub-sub for real-time notifications.
 *
 * Architecture:
 *   - Single Node.js process holds a Set of subscriber callbacks.
 *   - Any code in the same process can call `publish()` to fan-out an
 *     event to all subscribers.
 *   - SSE endpoint (`/api/notifications/sse`) calls `subscribe()` on
 *     connect, `unsubscribe()` on disconnect.
 *
 * Limitations:
 *   - Single-process only. For multi-process/multi-instance
 *     deployments, swap the `subscribers` Set for a Redis Pub/Sub
 *     adapter (or use `@socket.io/redis-adapter` if we migrate to
 *     socket.io later). The interface stays the same.
 *   - No persistence — missed events while offline are lost. For a
 *     production site, pair this with a `notifications` DB table
 *     that the client polls on first mount to catch up.
 *
 * Event shape (the JSON the SSE endpoint writes per event):
 *   {
 *     id: string,           // unique event id (used as SSE id field)
 *     type: "amendment" | "bookmark" | "system" | ...,
 *     title: string,        // short headline (shown in toast)
 *     body?: string,        // optional longer body
 *     url?: string,         // optional click-through URL
 *     timestamp: number,    // epoch ms
 *     scope?: string,       // optional routing scope (e.g. user id)
 *   }
 */

export interface NotificationEvent {
  id: string;
  type: "amendment" | "bookmark" | "system" | "law" | "reference";
  title: string;
  body?: string;
  url?: string;
  timestamp: number;
  scope?: string; // user id for targeted notifications; undefined = broadcast
}

type Subscriber = (event: NotificationEvent) => void;

const subscribers = new Set<Subscriber>();

export function subscribe(cb: Subscriber): () => void {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

export function publish(event: Omit<NotificationEvent, "id" | "timestamp">): NotificationEvent {
  const full: NotificationEvent = {
    ...event,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
  };
  // Fan-out synchronously — each subscriber is responsible for its
  // own error handling so a single broken listener doesn't kill the
  // others.
  for (const cb of subscribers) {
    try {
      cb(full);
    } catch (err) {
      console.error("[notifications] subscriber threw:", err);
    }
  }
  // Also log to stdout for dev visibility.
  if (process.env.NODE_ENV !== "production") {
    console.log(`[notifications] published: ${full.type} — ${full.title}`);
  }
  return full;
}

// Convenience helpers for common event types.

export function notifyNewAmendment(lawTitle: string, amendmentDescription: string, url?: string): void {
  publish({
    type: "amendment",
    title: `اصلاح جدید در ${lawTitle}`,
    body: amendmentDescription,
    url,
  });
}

export function notifySystem(title: string, body?: string): void {
  publish({ type: "system", title, body });
}
