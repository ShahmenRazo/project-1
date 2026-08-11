"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, Link2, Loader2, Mail, QrCode, Send, UserPlus } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
 * «Invite friends» — вкладки Link (по умолчанию), Email, QR.
 * Только для создателя группы.
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

  const [email, setEmail] = useState("");
  const [share, setShare] = useState(freeShare > 0 ? String(freeShare) : "");
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

  async function sendEmailInvite() {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      toast.error("Enter a valid email");
      return;
    }
    const sharePercent = Number(share);
    if (share === "" || Number.isNaN(sharePercent) || sharePercent <= 0) {
      toast.error("Enter a valid share");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_id: groupId,
          email: email.trim(),
          share_percent: sharePercent,
        }),
      });
      const json = (await res.json().catch(() => null)) as {
        data?: { email: string; link: string };
        error?: { message?: string };
      } | null;
      if (!res.ok) {
        toast.error(json?.error?.message ?? "Failed to send invite");
        return;
      }
      setEmail("");
      trackEvent("invite_sent", { method: "email" });
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
      <Tabs defaultValue="link">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="link">
          <Link2 className="mr-1.5 h-4 w-4" />
          Link
        </TabsTrigger>
        <TabsTrigger value="email">
          <Mail className="mr-1.5 h-4 w-4" />
          Email
        </TabsTrigger>
        <TabsTrigger value="qr">
          <QrCode className="mr-1.5 h-4 w-4" />
          QR
        </TabsTrigger>
      </TabsList>

      <TabsContent value="link" className="space-y-3 pt-4">
        {invite ? (
          <>
            <div className="flex gap-2">
              <Input readOnly value={link} onFocus={(e) => e.target.select()} />
              <Button variant="outline" size="icon" onClick={copyLink}>
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <ShareButtons link={link} text={shareText(link)} />
            {invite.max_uses > 0 && (
              <p className="text-xs text-muted-foreground">
                Used {invite.uses_count} of {invite.max_uses}
              </p>
            )}
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Create a link anyone can use to join the group and get the free
              share of the subscription.
            </p>
            <Button onClick={createInvite} disabled={creating}>
              {creating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="mr-2 h-4 w-4" />
              )}
              Create link
            </Button>
          </div>
        )}
      </TabsContent>

      <TabsContent value="email" className="space-y-3 pt-4">
        <p className="text-sm text-muted-foreground">
          Send an invite to a friend&apos;s email. They will get a link to
          claim their share.
        </p>
        <div className="space-y-2">
          <Label htmlFor="invite-email">Email</Label>
          <Input
            id="invite-email"
            type="email"
            placeholder="friend@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invite-share">
            Share, % — free now: {freeShare}%
          </Label>
          <Input
            id="invite-share"
            type="number"
            min={1}
            max={freeShare}
            value={share}
            onChange={(e) => setShare(e.target.value)}
          />
        </div>
        <Button onClick={sendEmailInvite} disabled={sending} className="w-full">
          {sending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Send invite
        </Button>
      </TabsContent>

      <TabsContent value="qr" className="flex flex-col items-center gap-3 pt-4">
        {invite ? (
          <>
            <div className="rounded-xl border p-4">
              <QRCodeSVG value={link} size={180} level="M" />
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Scan with a phone camera to open the join page.
            </p>
            <ShareButtons link={link} text={shareText(link)} />
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Create a public link first to get a QR code.
            </p>
            <Button onClick={createInvite} disabled={creating}>
              {creating && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create link
            </Button>
          </div>
        )}
      </TabsContent>
    </Tabs>
    </div>
  );
}
