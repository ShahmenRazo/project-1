"use client";

import { useEffect, useState } from "react";
import { BellRing } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { requestPushPermission } from "@/lib/push/client";

/**
 * Кнопка «Включить push-уведомления».
 * Запрашивает разрешение браузера, получает FCM-токен и сохраняет его
 * в Supabase (POST /api/push/subscribe).
 */
export function EnableNotificationsButton() {
  const [granted, setGranted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setGranted(Notification.permission === "granted");
    }
  }, []);

  async function handleClick() {
    setLoading(true);
    const result = await requestPushPermission();
    setLoading(false);

    if (result.granted) {
      setGranted(true);
      toast.success("Push-уведомления включены");
    } else {
      setGranted(false);
      toast.error(
        "Разрешите уведомления в настройках браузера и попробуйте снова"
      );
    }
  }

  if (granted) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={loading}
    >
      <BellRing className="h-4 w-4" />
      {loading ? "Подключение…" : "Push-уведомления"}
    </Button>
  );
}
