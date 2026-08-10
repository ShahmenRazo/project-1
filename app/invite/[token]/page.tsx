import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  CreditCard,
  Mail,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AcceptInviteButton } from "@/components/invites/accept-invite-button";
import { createClient } from "@/lib/supabase/server";
import { fetchInviteByToken, isInviteValid } from "@/lib/invites";
import { formatMoney } from "@/lib/format";
import { roundMoney, shareAmount } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InvitePage({
  params,
}: {
  params: { token: string };
}) {
  const invite = await fetchInviteByToken(params.token);

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // --- Невалидный / истёкший / принятый invite ---
  if (!invite || !isInviteValid(invite)) {
    return (
      <div className="flex min-h-screen flex-col">
        <PublicHeader />
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <AlertTriangle className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium">Приглашение недействительно</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ссылка устарела, истекла или уже была использована. Попросите
                  создателя группы отправить новое приглашение.
                </p>
              </div>
              <Button asChild>
                <Link href="/">На главную</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const group = invite.groups!;
  const subscription = group.subscriptions;
  const creator = group.users;
  const creatorName =
    creator?.display_name ??
    (creator?.email ? creator.email.split("@")[0] : "Пользователь");

  const amount = subscription
    ? roundMoney(
        shareAmount(
          subscription.price,
          invite.share_percent,
          subscription.billing_cycle
        )
      )
    : null;

  const expiresLabel = new Date(invite.expires_at).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl">Вас пригласили в группу</CardTitle>
            <CardDescription>
              {creatorName} делится с вами подпиской через SubSplit.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4 rounded-lg border p-3 text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Группа
                </span>
                <span className="font-medium">{group.name}</span>
              </div>

              {subscription && (
                <div className="flex items-center justify-between gap-4 rounded-lg border p-3 text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <CreditCard className="h-4 w-4" />
                    Подписка
                  </span>
                  <span className="font-medium">
                    {subscription.name} ·{" "}
                    {formatMoney(subscription.price, subscription.currency)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between gap-4 rounded-lg border p-3 text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <ShieldCheck className="h-4 w-4" />
                  Ваша доля
                </span>
                <span className="font-medium">{invite.share_percent}%</span>
              </div>

              {amount !== null && (
                <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/40 p-3 text-sm">
                  <span className="text-muted-foreground">
                    К оплате ({subscription!.billing_cycle === "yearly" ? "в год" : "в месяц"})
                  </span>
                  <span className="text-lg font-semibold tabular-nums">
                    {formatMoney(amount, subscription!.currency)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between gap-4 rounded-lg border p-3 text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <CalendarClock className="h-4 w-4" />
                  Приглашение действует
                </span>
                <span className="font-medium">до {expiresLabel}</span>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-lg border p-3 text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  Приглашённый email
                </span>
                <span className="font-medium">{invite.email}</span>
              </div>
            </div>

            {user ? (
              <div className="flex flex-col items-center gap-3">
                <AcceptInviteButton token={invite.token} />
                <p className="text-xs text-muted-foreground">
                  Вы вошли как {user.email}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href={`/login?next=/invite/${invite.token}`}>
                    Зарегистрироваться и принять
                  </Link>
                </Button>
                <p className="text-xs text-muted-foreground">
                  После входа вы сможете принять приглашение
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function PublicHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <ShieldCheck className="h-5 w-5" />
          SubSplit
        </Link>
        <Button asChild variant="outline" size="sm">
          <Link href="/login">Войти</Link>
        </Button>
      </div>
    </header>
  );
}
