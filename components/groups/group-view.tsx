"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CreditCard, UserX } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RemindButton } from "@/components/groups/remind-button";
import { BalanceCalculator } from "@/components/groups/balance-calculator";
import { PublicInviteDialog } from "@/components/groups/public-invite-dialog";
import { formatMoney } from "@/lib/format";
import { initials } from "@/lib/format";
import { roundMoney } from "@/lib/utils";
import type { BillingCycle } from "@/lib/database.types";

export interface GroupViewMember {
  user_id: string;
  name: string;
  avatar_url: string | null;
  share_percent: number;
  payment_status: "pending" | "paid";
  is_creator: boolean;
}

export interface GroupViewPayment {
  id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  currency: string;
  due_date: string;
}

export interface GroupViewProps {
  groupId: string;
  groupName: string;
  isCreator: boolean;
  currentUserId: string;
  subscription: {
    name: string;
    price: number;
    currency: string;
    billing_cycle: BillingCycle;
    billing_day: number;
  } | null;
  members: GroupViewMember[];
  payments: GroupViewPayment[];
}

export function GroupView({
  groupId,
  groupName,
  isCreator,
  currentUserId,
  subscription,
  members,
  payments,
}: GroupViewProps) {
  const router = useRouter();
  const [payingIds, setPayingIds] = useState<Set<string>>(new Set());

  const totalMonthly = useMemo(() => {
    if (!subscription) return 0;
    return roundMoney(
      subscription.billing_cycle === "monthly"
        ? subscription.price
        : subscription.price / 12
    );
  }, [subscription]);

  // Месячная стоимость свободной доли (для публичной ссылки/шеринга)
  const freeShareMonthly = useMemo(() => {
    const used = members.reduce((sum, m) => sum + m.share_percent, 0);
    const remaining = roundMoney(100 - used);
    if (remaining <= 0) return 0;
    return roundMoney((totalMonthly * remaining) / 100);
  }, [members, totalMonthly]);

  const debtByUserId = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of payments) {
      map.set(p.from_user_id, (map.get(p.from_user_id) ?? 0) + p.amount);
    }
    return map;
  }, [payments]);

  const myDebts = useMemo(
    () => payments.filter((p) => p.from_user_id === currentUserId),
    [payments, currentUserId]
  );

  const markPaid = async (paymentId: string) => {
    setPayingIds((prev) => new Set(prev).add(paymentId));
    try {
      const res = await fetch(`/api/payments/${paymentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid" }),
      });
      const json = (await res.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;

      if (!res.ok) {
        toast.error(json?.error?.message ?? "Не удалось отметить оплату");
        return;
      }

      toast.success("Долг оплачен");
      router.refresh();
    } catch {
      toast.error("Ошибка сети, попробуйте ещё раз");
    } finally {
      setPayingIds((prev) => {
        const next = new Set(prev);
        next.delete(paymentId);
        return next;
      });
    }
  };

  const currency = subscription?.currency ?? payments[0]?.currency ?? "USD";
  const anyDebts = payments.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{groupName}</h1>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CreditCard className="h-4 w-4" />
            {subscription ? (
              <>
                {subscription.name} · {formatMoney(subscription.price, subscription.currency)}{" "}
                {subscription.billing_cycle === "yearly" ? "/год" : "/мес"}
                {subscription.billing_cycle === "yearly" && (
                  <span className="text-xs">
                    (~{formatMoney(totalMonthly, currency)}/мес)
                  </span>
                )}
              </>
            ) : (
              "Без подписки"
            )}
          </p>
        </div>
        {isCreator && (
          <div className="flex gap-2">
            <PublicInviteDialog
              groupId={groupId}
              groupName={groupName}
              subscriptionName={subscription?.name ?? null}
              shareMonthly={freeShareMonthly}
              currency={currency}
            />
            <RemindButton groupId={groupId} />
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Участники</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">Пока нет участников</p>
          ) : (
            members.map((m) => {
              const owes = debtByUserId.get(m.user_id) ?? 0;
              return (
                <div
                  key={m.user_id}
                  className="flex items-center gap-3"
                >
                  <Avatar className="h-9 w-9">
                    {m.avatar_url && <AvatarImage src={m.avatar_url} alt={m.name} />}
                    <AvatarFallback>{initials(m.name)}</AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate text-sm font-medium">
                      {m.name}
                      {m.is_creator && (
                        <Badge variant="secondary" className="text-[10px]">
                          создатель
                        </Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Доля {m.share_percent}% ·{" "}
                      {m.payment_status === "paid" ? "всё оплачено" : "есть долг"}
                    </p>
                  </div>

                  <Badge
                    variant={owes > 0 ? "destructive" : "secondary"}
                    className="tabular-nums"
                  >
                    {owes > 0 ? `должен ${formatMoney(owes, currency)}` : "чист"}
                  </Badge>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {myDebts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ваши долги</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {myDebts.map((p) => {
              const paying = payingIds.has(p.id);
              return (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="min-w-0 text-sm">
                    <p className="font-medium">
                      {formatMoney(p.amount, p.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Долг за {subscription?.name ?? "подписку"} · до{" "}
                      {new Date(p.due_date).toLocaleDateString("ru-RU")}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => markPaid(p.id)}
                    disabled={paying}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {paying ? "Сохраняем…" : "Отметить оплаченным"}
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {anyDebts ? (
        <BalanceCalculator members={members} payments={payments} />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <UserX className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Все долги оплачены — отличная работа!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
