"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Link2, Loader2, PartyPopper } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ShareButtons } from "@/components/groups/ShareButtons";
import { trackEvent } from "@/lib/analytics";

interface InviteData {
  token: string;
  url: string;
}

/**
 * Баннер для группы с одним участником (только создатель):
 * приглашение через ссылку / WhatsApp / Telegram / QR.
 */
export function SoloInviteBanner({
  groupId,
  groupName,
  subscriptionName,
}: {
  groupId: string;
  groupName: string;
  subscriptionName: string | null;
}) {
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const loadInvite = useCallback(async () => {
    try {
      const res = await fetch(`/api/public-invites?group_id=${groupId}`);
      const json = (await res.json().catch(() => null)) as {
        data?: { invite: InviteData | null };
      } | null;
      setInvite(json?.data?.invite ?? null);
    } catch {
      // keep previous state
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    void loadInvite();
  }, [loadInvite]);

  async function createInvite() {
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
      trackEvent("invite_sent", { method: "public_link" });
    } catch {
      toast.error("Network error, please try again");
    }
  }

  async function copyLink() {
    if (!invite) return;
    const link = `${window.location.origin}${invite.url}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Invite link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  }

  const link = invite ? `${window.location.origin}${invite.url}` : "";
  const shareText = (l: string) =>
    `Join my${subscriptionName ? ` ${subscriptionName} family` : ""} on SubSplit: ${l}`;

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-start gap-3">
        <PartyPopper className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="flex-1">
          <p className="text-sm font-semibold">
            You&apos;re the only one here. Invite friends to split the cost!
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Share the free share of {subscriptionName ?? "the subscription"} and
            split the bill.
          </p>

          {loading ? (
            <Button variant="outline" size="sm" disabled className="mt-3">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating link…
            </Button>
          ) : invite ? (
            <div className="mt-3 space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={copyLink}>
                  {copied ? (
                    <Check className="mr-1.5 h-4 w-4 text-emerald-300" />
                  ) : (
                    <Copy className="mr-1.5 h-4 w-4" />
                  )}
                  Copy invite link
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(
                        `https://wa.me/?text=${encodeURIComponent(shareText(link))}`,
                        "_blank"
                      )
                    }
                  >
                    Share to WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(
                        `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(shareText(link))}`,
                        "_blank"
                      )
                    }
                  >
                    Share to Telegram
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-lg border bg-card p-2">
                  <QRCodeSVG value={link} size={96} level="M" />
                </div>
                <div className="hidden sm:block">
                  <ShareButtons link={link} text={shareText(link)} />
                </div>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={createInvite} className="mt-3">
              <Link2 className="mr-1.5 h-4 w-4" />
              Create invite link
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
