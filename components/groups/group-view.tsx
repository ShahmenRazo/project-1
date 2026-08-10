"use client";

import { useMemo } from "react";
import { CreditCard, UserX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RemindButton } from "@/components/groups/remind-button";
import { BalanceCalculator } from "@/components/groups/balance-calculator";
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
  subscription,
  members,
  payments,
}: GroupViewProps) {
  const totalMonthly = useMemo(() => {
    if (!subscription) return 0;
    return roundMoney(
      subscription.billing_cycle === "monthly"
        ? subscription.price
        : subscription.price / 12
    );
  }, [subscription]);

  const debtByUserId = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of payments) {
      map.set(p.from_user_id, (map.get(p.from_user_id) ?? 0) + p.amount);
    }
    return map;
  }, [payments]);

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
        {isCreator && <RemindButton groupId={groupId} />}
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
