"use client";

/**
 * NotificationListener — invisible client component that subscribes to
 * the SSE notification stream and surfaces incoming events as toasts.
 *
 * Mounted by the (public) layout so the connection is always live for
 * signed-in AND anonymous users (anonymous users only see broadcasts).
 *
 * Renders nothing — purely a side-effect component.
 */

import { useCallback } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { NotificationEvent } from "@/lib/notifications/pubsub";

export function NotificationListener() {
  const { toast } = useToast();
  const router = useRouter();

  const onEvent = useCallback(
    (event: NotificationEvent) => {
      toast({
        title: event.title,
        description: event.body,
        // Future: an "action" prop on the toast that calls router.push(event.url)
      });
      // If event has a URL, force a refresh of any cached page data
      // by calling router.refresh() — Next.js will re-fetch any RSC
      // payloads the current view depends on.
      if (event.url) {
        // Defer router.refresh so the toast has time to render.
        setTimeout(() => router.refresh(), 100);
      }
    },
    [toast, router]
  );

  useNotifications(onEvent);
  return null;
}
