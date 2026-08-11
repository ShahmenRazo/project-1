import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { JoinGroupButton } from "@/components/groups/join-group-button";
import { getPublicInviteInfo } from "@/lib/public-invites";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { token: string };
}): Promise<Metadata> {
  const info = await getPublicInviteInfo(params.token).catch(() => null);
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://kitstartai.com";
  return {
    title: info?.valid
      ? `Join "${info.group_name}"`
      : "Group invite",
    description: info?.valid
      ? `Split ${info.subscription?.name ?? ""} with friends on SubSplit — from ${formatMoney(info.share_monthly, info.currency)}/mo`
      : undefined,
    openGraph: info?.valid
      ? {
          title: `Join "${info.group_name}"`,
          description: `Split a subscription on SubSplit — from ${formatMoney(info.share_monthly, info.currency)}/mo`,
          images: [{ url: `/api/og?group=${info.group_id}`, width: 1200, height: 630 }],
          url: `${base}/join/${params.token}`,
        }
      : undefined,
  };
}

export default async function JoinPage({
  params,
}: {
  params: { token: string };
}) {
  const info = await getPublicInviteInfo(params.token).catch(() => null);

  // Пользователь уже залогинен?
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const invalid = !info || !info.valid;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="h-5 w-5" />
            SubSplit
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          {invalid ? (
            <>
              <CardHeader>
                <CardTitle className="text-xl">
                  Invalid link
                </CardTitle>
                <CardDescription>
                  {info?.reason === "expired"
                    ? "This link has expired."
                    : info?.reason === "uses_exhausted"
                      ? "This link has reached its usage limit."
                      : "Invitation not found or has been removed."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/">Home</Link>
                </Button>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader>
                <CardTitle className="text-xl">
                  Join group
                </CardTitle>
                <CardDescription>
                  {info.creator_id === user?.id
                    ? "This is your group — you are already in it."
                    : "You've been invited to split a subscription on SubSplit."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1 rounded-lg border p-4">
                  <p className="font-semibold">{info.group_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {info.subscription
                      ? `${info.subscription.name} · ${formatMoney(info.subscription.price, info.subscription.currency)}${
                          info.subscription.billing_cycle === "yearly" ? "/yr" : "/mo"
                        }`
                      : "No subscription"}
                  </p>
                  {info.inviter_name && info.creator_id !== user?.id && (
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <ShieldCheck className="h-4 w-4" />
                      Invited by {info.inviter_name}
                    </p>
                  )}
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {info.member_count}{" "}
                    {info.member_count === 1 ? "member" : "members"} already in the group
                  </p>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-muted/60 px-4 py-3">
                  <span className="text-sm text-muted-foreground">
                    Your share
                  </span>
                  <span className="font-semibold tabular-nums">
                    {info.share_percent}%
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-muted/60 px-4 py-3">
                  <span className="text-sm text-muted-foreground">
                    {info.subscription
                      ? `About ${formatMoney(info.share_monthly, info.currency)}/mo`
                      : "Share price"}
                  </span>
                  <span className="font-semibold tabular-nums">
                    {info.share_monthly > 0
                      ? formatMoney(info.share_monthly, info.currency)
                      : "—"}
                  </span>
                </div>

                {info.full && (
                  <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                    The group is full — the creator needs to upgrade to Pro to
                    add more members.
                  </p>
                )}

                {user ? (
                  <JoinGroupButton token={info.token} disabled={info.full} />
                ) : (
                  <div className="space-y-2">
                    <Button asChild className="w-full">
                      <Link href={`/login?next=/join/${info.token}`}>
                        Sign up and join
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/login?next=/join/${info.token}`}>
                        Log in and join
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </>
          )}
        </Card>
      </main>
    </div>
  );
}
