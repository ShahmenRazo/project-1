"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { apiErrorMessageAsync } from "@/lib/client-errors";
import { Button } from "@/components/ui/button";
import { Confetti } from "@/components/groups/confetti";

/**
 * Присоединение к группе по публичной ссылке.
 * auto — примонтировались и сразу джойним (после входа/редиректа).
 * celebrate — после успеха показываем конфетти и переходим в группу.
 */
export function JoinGroupButton({
  token,
  disabled,
  auto = false,
  celebrate = false,
}: {
  token: string;
  disabled?: boolean;
  auto?: boolean;
  celebrate?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);
  const attempted = useRef(false);

  async function handleJoin(silent = false) {
    if (loading || attempted.current) return;
    attempted.current = true;
    setLoading(true);
    try {
      const res = await fetch(`/api/public-invites/${token}`, {
        method: "POST",
      });
      const json = (await res.json().catch(() => null)) as {
        data?: { group_id: string };
        error?: { message?: string; code?: string };
      } | null;

      if (!res.ok) {
        if (json?.error?.code === "ALREADY_MEMBER") {
          toast.info("You're already in this group");
        } else {
          toast.error(
            await apiErrorMessageAsync(
              res,
              json?.error?.message ?? "Failed to join"
            )
          );
        }
        return;
      }

      setJoined(true);
      const groupId = json?.data?.group_id;
      if (celebrate) {
        setTimeout(() => {
          if (groupId) {
            router.push(`/groups/${groupId}`);
            router.refresh();
          }
        }, 2800);
      } else if (!silent) {
        toast.success("You're in the group! Welcome");
        if (groupId) {
          router.push(`/groups/${groupId}`);
          router.refresh();
        }
      }
    } catch {
      toast.error("Network error, please try again");
    } finally {
      setLoading(false);
    }
  }

  // Авто-джоин: страница смонтировалась с авторизованным пользователем
  useEffect(() => {
    if (auto && !attempted.current && !disabled) {
      void handleJoin(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, disabled]);

  if (celebrate) {
    return (
      <>
        {joined && <Confetti show />}
        <Button className="w-full" disabled={disabled || loading}>
          {joined ? "Joined!" : loading ? "Joining…" : "Join group"}
        </Button>
      </>
    );
  }

  return (
    <Button
      className="w-full"
      onClick={() => void handleJoin(false)}
      disabled={disabled || loading}
    >
      <UserPlus className="mr-2 h-4 w-4" />
      {loading ? "Joining…" : "Join group"}
    </Button>
  );
}