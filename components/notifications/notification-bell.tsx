"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Bell, CheckCircle2, Mail, Megaphone, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { NotificationListSkeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { NotificationType } from "@/lib/database.types";

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  read: boolean;
  created_at: string;
}

const TYPE_ICONS: Record<NotificationType, typeof Bell> = {
  payment_due: AlertCircle,
  payment_paid: CheckCircle2,
  group_invite: UserPlus,
  reminder: Megaphone,
  system: Mail,
};

const POLL_INTERVAL_MS = 30_000;

export function NotificationBell() {
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=8");
      if (!res.ok) return;
      const { data } = (await res.json()) as {
        data: { notifications: Notification[]; unread_count: number };
      };
      setNotifications(data.notifications);
      setCount(data.unread_count);
    } catch {
      // network/server unavailable — keep previous state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [load]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <Badge className="absolute -right-1 -top-1 h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] tabular-nums">
              {count > 99 ? "99+" : count}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notifications
          {count > 0 && (
            <Badge variant="secondary" className="text-xs">
              {count} new
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <NotificationListSkeleton />
          ) : notifications.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              No notifications yet
            </p>
          ) : (
            notifications.map((n, i) => {
              const Icon = TYPE_ICONS[n.type] ?? Bell;
              return (
                <div key={n.id}>
                  {i > 0 && <Separator />}
                  <div
                    className={cn(
                      "flex gap-3 px-4 py-3 text-sm",
                      !n.read && "bg-accent/40"
                    )}
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "break-words",
                          !n.read && "font-medium"
                        )}
                      >
                        {n.message}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDateTime(n.created_at)}
                      </p>
                    </div>
                    {!n.read && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
