"use client";

import { useMemo } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowRight,
  Info,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { settleDebts } from "@/lib/balances";
import { formatMoney } from "@/lib/format";
import { roundMoney } from "@/lib/utils";

export interface BalanceMember {
  user_id: string;
  name: string;
}

export interface BalancePayment {
  id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  currency: string;
  due_date: string;
}

/**
 * BalanceCalculator — считает оптимальные переводы в группе.
 * Использует settleDebts (нетто-балансы + жадный матчинг крупнейших сумм):
 * число переводов = max(#должников, #кредиторов) — это минимум.
 */
export function BalanceCalculator({
  members,
  payments,
}: {
  members: BalanceMember[];
  payments: BalancePayment[];
}) {
  const nameById = useMemo(
    () => new Map(members.map((m) => [m.user_id, m.name])),
    [members]
  );

  const settlements = useMemo(() => settleDebts(payments), [payments]);
  const currency = payments[0]?.currency ?? "USD";

  // Для сравнения: сколько было бы переводов БЕЗ оптимизации
  const naiveCount = useMemo(() => {
    const count = new Map<string, number>();
    for (const p of payments) {
      count.set(p.from_user_id, (count.get(p.from_user_id) ?? 0) + 1);
    }
    let total = 0;
    for (const c of count.values()) total += c;
    return total;
  }, [payments]);

  if (payments.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
          <Info className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No active debts in this group
          </p>
        </CardContent>
      </Card>
    );
  }

  const transferCount = settlements.length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          Optimal transfers
        </CardTitle>
        <span className="text-xs text-muted-foreground">
          {naiveCount > transferCount
            ? `${naiveCount} → ${transferCount} transfers`
            : `${transferCount} ${plural(transferCount)}`}
        </span>
      </CardHeader>
      <CardContent className="space-y-3">
        {settlements.map((s, i) => {
          const from = nameById.get(s.from_user_id) ?? "Someone";
          const to = nameById.get(s.to_user_id) ?? "Someone";
          return (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2 text-sm">
                <ArrowUp className="h-4 w-4 shrink-0 text-destructive" />
                <span className="truncate font-medium">{from}</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                <ArrowDown className="h-4 w-4 shrink-0 text-emerald-600" />
                <span className="truncate font-medium">{to}</span>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums">
                {formatMoney(roundMoney(s.amount), currency)}
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function plural(n: number): string {
  return n === 1 ? "transfer" : "transfers";
}
