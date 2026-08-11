"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, Loader2, Mail, QrCode, UserPlus } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ShareButtons } from "@/components/groups/ShareButtons";
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
 * «Invite friends» — приглашение по email/username + публичная ссылка + QR.
 * Виден создателю, пока в группе есть свободные места.
 */
export function InviteFriends({
  groupId,
  groupName,
  subscriptionName,
  shareMonthly,
  currency,
  freeShare,
}: {
  groupId: string;
  groupName: string;
  subscriptionName: string | null;
  shareMonthly: number;
  currency: string;
  freeShare: number;
}) {
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const [target, setTarget] = useState("");
  const [sending, setSending] = useState(false);

  const loadInvite = useCallback(async () => {
    const res = await fetch(`/api/public-invites?group_id=${groupId}`);
    const json = (await res.json().catch(() => null)) as {
      data?: { invite: InviteData | null };
    } | null;
    setInvite(json?.data?.invite ?? null);
  }, [groupId]);

  useEffect(() => {
    void loadInvite();
  }, [loadInvite]);

  async function createInvite() {
    setCreating(true);
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
      setCreating(false);
    }
  }

  async function copyLink() {
    if (!invite) return;
    const link = `${window.location.origin}${invite.url}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  }

  const link = useMemo(
    () => (invite ? `${window.location.origin}${invite.url}` : ""),
    [invite]
  );

  const shareText = (l: string) => {
    const sub = subscriptionName ? ` ${subscriptionName} family` : "";
    const price =
      shareMonthly > 0 ? ` — ${formatMoney(shareMonthly, currency)}/mo` : "";
    return `Join my${sub} on SubSplit${price}: ${l}`;
  };

  async function sendInvite() {
    const value = target.trim();
    if (!value) {
      toast.error("Enter an email or username");
      return;
    }
    setSending(true);
    try {
      const body: Record<string, unknown> = { group_id: groupId };
      if (freeShare > 0) {
        body.share_percent = freeShare;
      }
      if (value.includes("@")) {
        body.email = value;
      } else {
        body.username = value;
      }

      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => null)) as {
        data?: { email: string; link: string };
        error?: { message?: string };
      } | null;
      if (!res.ok) {
        toast.error(json?.error?.message ?? "Failed to send invite");
        return;
      }
      setTarget("");
      trackEvent("invite_sent", { method: value.includes("@") ? "email" : "username" });
      if (json?.data?.link) {
        toast.success("Invite sent", {
          action: {
            label: "Copy link",
            onClick: () => void navigator.clipboard.writeText(json.data!.link),
          },
        });
      } else {
        toast.success("Invite sent");
      }
    } catch {
      toast.error("Network error, please try again");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold">
        <UserPlus className="h-4 w-4" />
        Invite friends
      </h2>
      <p className="mb-4 text-xs text-muted-foreground">
        Share the free share of the subscription with friends.
      </p>

      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Enter email or username"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void sendInvite();
                }
              }}
              aria-label="Enter email or username"
            />
          </div>
          <Button onClick={() => void sendInvite()} disabled={sending}>
            {sending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Mail className="mr-2 h-4 w-4" />
            )}
            Invite
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {freeShare > 0
            ? `Share offered: ${freeShare}%`
            : "The share is taken from the creator's share on join."}
        </p>
      </div>

      <div className="mt-4 space-y-3 border-t pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Or share link</span>
          {invite ? (
            <>
              <Button variant="outline" size="sm" onClick={copyLink}>
                {copied ? (
                  <Check className="mr-1.5 h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="mr-1.5 h-4 w-4" />
                )}
                Copy link
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowQr((v) => !v)}
              >
                <QrCode className="mr-1.5 h-4 w-4" />
                {showQr ? "Hide QR" : "Show QR"}
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={createInvite}
              disabled={creating}
            >
              {creating && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Create link
            </Button>
          )}
        </div>

        {invite && (
          <div className="space-y-3">
            <ShareButtons link={link} text={shareText(link)} />
            {invite.max_uses > 0 && (
              <p className="text-xs text-muted-foreground">
                Used {invite.uses_count} of {invite.max_uses}
              </p>
            )}
            <div
              className={cn(
                "flex flex-col items-center gap-2 transition-all",
                showQr ? "max-h-64 opacity-100" : "max-h-0 overflow-hidden opacity-0"
              )}
            >
              <div className="rounded-xl border p-4">
                <QRCodeSVG value={link} size={160} level="M" />
              </div>
              <p className="text-xs text-muted-foreground">
                Scan with a phone camera to open the join page.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
