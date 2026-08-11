"use client";

import { useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { apiErrorMessageAsync } from "@/lib/client-errors";
import { Button } from "@/components/ui/button";

/**
 * Смарт-промпт: email не подтверждён — создание/вступление в группы
 * ограничено, пока не подтвердите почту.
 */
export function EmailVerifyBanner({ email }: { email: string }) {
  const [sending, setSending] = useState(false);

  const resend = async () => {
    if (sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = (await res.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      if (!res.ok) {
        toast.error(
          await apiErrorMessageAsync(
            res,
            json?.error?.message ?? "Failed to send verification email"
          )
        );
        return;
      }
      toast.success("Verification email sent — check your inbox");
    } catch {
      toast.error("Network error, please try again");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
      <div className="flex items-start gap-3">
        <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        <div className="text-sm">
          <p className="font-medium">Verify your email</p>
          <p className="text-muted-foreground">
            Create and join groups is locked until you confirm your email.
            We sent a link to {email}.
          </p>
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={() => void resend()} disabled={sending}>
        {sending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          "Resend email"
        )}
      </Button>
    </div>
  );
}
