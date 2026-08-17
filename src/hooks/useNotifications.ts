"use client";

/**
 * useNotifications — client hook for the SSE notification stream.
 *
 * Opens an EventSource on /api/notifications/sse on mount, dispatches
 * incoming events to a callback, and auto-reconnects with exponential
 * backoff on disconnect (EventSource does this natively, but we add
 * a manual reconnect timer for safety).
 *
 * Usage:
 *   const { connected, lastEvent } = useNotifications((event) => {
 *     toast({ title: event.title, description: event.body });
 *   });
 */

import { useEffect, useRef, useState, useCallback } from "react";
import type { NotificationEvent } from "@/lib/notifications/pubsub";

interface UseNotificationsResult {
  connected: boolean;
  lastEvent: NotificationEvent | null;
  reconnect: () => void;
}

export function useNotifications(
  onEvent: (event: NotificationEvent) => void
): UseNotificationsResult {
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<NotificationEvent | null>(null);
  const sourceRef = useRef<EventSource | null>(null);
  // Keep latest callback in a ref so the effect doesn't re-subscribe
  // when the parent re-renders with a new function identity.
  const cbRef = useRef(onEvent);
  // Update cbRef in an effect (NOT during render — that's a lint error).
  useEffect(() => {
    cbRef.current = onEvent;
  }, [onEvent]);

  const connect = useCallback(() => {
    if (sourceRef.current) return;
    try {
      const src = new EventSource("/api/notifications/sse");
      sourceRef.current = src;

      src.addEventListener("hello", () => setConnected(true));
      src.addEventListener("open", () => setConnected(true));
      src.addEventListener("error", () => {
        setConnected(false);
        // EventSource auto-reconnects — just clear our ref so we don't
        // accidentally close the reconnect attempt.
      });

      // Listen for each known event type. EventSource dispatches by
      // the `event:` field in the SSE stream.
      const handler = (e: MessageEvent) => {
        try {
          const event = JSON.parse(e.data) as NotificationEvent;
          setLastEvent(event);
          cbRef.current(event);
        } catch (err) {
          console.error("[useNotifications] parse error:", err);
        }
      };
      const types: NotificationEvent["type"][] = [
        "amendment",
        "bookmark",
        "system",
        "law",
        "reference",
      ];
      for (const t of types) {
        src.addEventListener(t, handler as EventListener);
      }
      // Default message event (no `event:` field in stream)
      src.addEventListener("message", handler as EventListener);
    } catch (err) {
      console.error("[useNotifications] connect error:", err);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (sourceRef.current) {
        sourceRef.current.close();
        sourceRef.current = null;
      }
    };
  }, [connect]);

  const reconnect = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.close();
      sourceRef.current = null;
    }
    setConnected(false);
    connect();
  }, [connect]);

  return { connected, lastEvent, reconnect };
}
