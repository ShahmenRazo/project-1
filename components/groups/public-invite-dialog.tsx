"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Link2, MessageCircle, Send, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatMoney } from "@/lib/format";
import { trackEvent } from "@/lib/analytics";

interface InviteData {
  token: string;
  url: string;
  max_uses: number;
  uses_count: number;
  expires_at: string | null;
}

/**
 * «Публичная ссылка» + кнопки шеринга (WhatsApp/Telegram/iMessage/Web Share).
 * Только для создателя группы. Создаёт/переиспользует публичный инвайт.
 */
export function PublicInviteDialog({
  groupId,
  groupName,
  subscriptionName,
  shareMonthly,
  currency,
}: {
  groupId: string;
  groupName: string;
  subscriptionName: string | null;
  shareMonthly: number;
  currency: string;
}) {
  const [open, setOpen] = useState(false);
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadInvite = useCallback(async () => {
    const res = await fetch(`/api/public-invites?group_id=${groupId}`);
    const json = (await res.json().catch(() => null)) as {
      data?: { invite: InviteData | null };
    } | null;
    setInvite(json?.data?.invite ?? null);
  }, [groupId]);

  useEffect(() => {
    if (open) void loadInvite();
  }, [open, loadInvite]);

  async function createInvite() {
    setLoading(true);
    try {
      const res = await fetch("/api/public-invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group_id: groupId }),
      });
      const json = (await res.json().catch(() => null)) as {
        data?: InviteData;
        error?: { message?: string };
      } | null;
      if (!res.ok) {
        toast.error(json?.error?.message ?? "Failed to create link");
        return;
      }
      await loadInvite();
      toast.success("Link created");
      trackEvent("invite_sent", { method: "public_link" });
    } catch {
      toast.error("Network error, please try again");
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!invite) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${invite.url}`);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  }

  async function nativeShare() {
    if (!invite) return;
    const link = `${window.location.origin}${invite.url}`;
    const text = shareText(link);
    if (navigator.share) {
      try {
        await navigator.share({ title: groupName, text, url: link });
      } catch {
        // пользователь отменил
      }
    } else {
      await copyLink();
    }
  }

  function shareText(link: string): string {
    const sub = subscriptionName ? ` ${subscriptionName} family` : "";
    const price =
      shareMonthly > 0 ? ` — ${formatMoney(shareMonthly, currency)}/mo` : "";
    return `Join my${sub} on SubSplit${price}: ${link}`;
  }

  const shareButtons = (link: string) => {
    const text = encodeURIComponent(shareText(link));
    const url = encodeURIComponent(link);
    return (
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            window.open(`https://wa.me/?text=${text}`, "_blank")
          }
        >
          <MessageCircle className="mr-1.5 h-4 w-4 text-emerald-600" />
          WhatsApp
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            window.open(`https://t.me/share/url?url=${url}&text=${text}`, "_blank")
          }
        >
          <Send className="mr-1.5 h-4 w-4 text-sky-600" />
          Telegram
        </Button>
        <Button variant="outline" size="sm" onClick={nativeShare}>
          <Share2 className="mr-1.5 h-4 w-4" />
          iMessage
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Link2 className="mr-2 h-4 w-4" />
          Public link
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Public link</DialogTitle>
          <DialogDescription>
            Anyone with the link can join the group and get the
            free share of the subscription.
          </DialogDescription>
        </DialogHeader>

        {invite ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                readOnly
                value={`${window.location.origin}${invite.url}`}
                onFocus={(e) => e.target.select()}
              />
              <Button variant="outline" onClick={copyLink}>
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            {invite.max_uses > 0 && (
              <p className="text-xs text-muted-foreground">
                Used {invite.uses_count} of {invite.max_uses}
              </p>
            )}
            {shareButtons(`${window.location.origin}${invite.url}`)}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            This group has no public link yet. Create one to
            invite friends.
          </p>
        )}

        <DialogFooter>
          {!invite && (
            <Button onClick={createInvite} disabled={loading}>
              {loading ? "Creating…" : "Create link"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
