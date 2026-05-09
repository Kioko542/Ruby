"use client";

import { useEffect, useRef, useState } from "react";
import type { WsEvent } from "@/lib/ruby-api";
import { eventsWebSocketUrl } from "@/lib/ruby-api";

const MAX_EVENTS = 80;

export function useRubyEventsWs(groupId?: string | null) {
  const [events, setEvents] = useState<WsEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      const url = eventsWebSocketUrl(groupId ?? undefined);
      try {
        ws = new WebSocket(url);
      } catch (e) {
        setError(e instanceof Error ? e.message : "WebSocket failed");
        return;
      }

      ws.onopen = () => {
        if (cancelled) return;
        setConnected(true);
        setError(null);
      };

      ws.onclose = () => {
        if (cancelled) return;
        setConnected(false);
        reconnectRef.current = setTimeout(connect, 2500);
      };

      ws.onerror = () => {
        setError("WebSocket error");
      };

      ws.onmessage = (ev) => {
        if (typeof ev.data !== "string") return;
        try {
          const parsed = JSON.parse(ev.data) as WsEvent;
          if (!parsed?.type) return;
          setEvents((prev) => {
            const next = [parsed, ...prev];
            return next.slice(0, MAX_EVENTS);
          });
        } catch {
          /* ignore ping / non-json */
        }
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      ws?.close();
    };
  }, [groupId]);

  return { events, connected, error, clearEvents: () => setEvents([]) };
}
