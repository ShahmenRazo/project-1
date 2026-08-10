"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Кнопка «Присоединиться» по публичной ссылке (авторизованный пользователь) */
export function JoinGroupButton({
  token,
  disabled,
}: {
  token: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/public-invites/${token}`, {
        method: "POST",
      });
      const json = (await res.json().catch(() => null)) as {
        data?: { group_id: string };
        error?: { message?: string };
      } | null;

      if (!res.ok) {
        toast.error(json?.error?.message ?? "Failed to join");
        return;
      }
      toast.success("You're in the group! Welcome");
      router.push(`/groups/${json?.data?.group_id}`);
      router.refresh();
    } catch {
      toast.error("Network error, please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button className="w-full" onClick={handleJoin} disabled={disabled || loading}>
      <UserPlus className="mr-2 h-4 w-4" />
      {loading ? "Joining…" : "Join group"}
    </Button>
  );
}
