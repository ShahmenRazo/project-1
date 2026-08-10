"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function RemindButton({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/remind`, {
        method: "POST",
      });
      const json = (await res.json().catch(() => null)) as {
        error?: { message?: string };
        data?: { reminded: number };
      } | null;

      if (!res.ok) {
        toast.error(json?.error?.message ?? "Не удалось отправить напоминания");
        return;
      }

      const reminded = json?.data?.reminded ?? 0;
      if (reminded === 0) {
        toast.info("Нет должников — все уже оплатили");
      } else {
        toast.success(`Напоминание отправлено ${reminded} участникам`);
      }
      router.refresh();
    } catch {
      toast.error("Ошибка сети, попробуйте ещё раз");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={loading}
    >
      <Send className="h-4 w-4" />
      {loading ? "Отправка…" : "Напомнить"}
    </Button>
  );
}
