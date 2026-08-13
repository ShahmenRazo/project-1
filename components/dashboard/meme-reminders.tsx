"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiErrorMessageAsync } from "@/lib/client-errors";
import { Button } from "@/components/ui/button";

interface MemeNotification {
  id: string;
  type: string;
  message: string;
  image_url: string | null;
  created_at: string;
}

export function MemeReminders() {
  const [notifications, setNotifications] = useState<MemeNotification[] | null>(
    null
  );
  const [marking, setMarking] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        const data = json?.data as { notifications?: MemeNotification[] };
        setNotifications(data?.notifications ?? []);
      })
      .catch(() => {
        if (!cancelled) setNotifications([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!notifications || notifications.length === 0) return null;

  const handleMark = async (id: string) => {
    setMarking((prev) => new Set(prev).add(id));
    try {
      const res = await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
      if (!res.ok) {
        toast.error(await apiErrorMessageAsync(res, "Failed to update"));
        return;
      }
      setNotifications((prev) =>
        (prev ?? []).filter((n) => n.id !== id)
      );
    } catch {
      toast.error("Network error, please try again");
    } finally {
      setMarking((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <div className="space-y-3">
      {notifications.map((n) => (
        <div
          key={n.id}
          className="flex items-center gap-4 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 p-3"
        >
          {n.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={n.image_url}
              alt="Reminder meme"
              className="h-20 w-20 shrink-0 rounded-lg object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm text-zinc-100">{n.message}</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {new Date(n.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            disabled={marking.has(n.id)}
            onClick={() => void handleMark(n.id)}
          >
            {marking.has(n.id) ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-1 h-4 w-4" />
            )}
            Got it
          </Button>
        </div>
      ))}
    </div>
  );
}