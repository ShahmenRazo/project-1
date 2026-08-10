"use client";

import { useMemo, useState } from "react";
import { Calculator, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMoney } from "@/lib/format";

const AVG_PRICE = 12.99; // средняя подписка, $/мес
const SHARE_PEOPLE = 4; // на скольких делим

export function SavingsCalculator() {
  const [count, setCount] = useState(5);

  const results = useMemo(() => {
    const aloneMonthly = AVG_PRICE * count;
    const aloneYearly = aloneMonthly * 12;
    const splitYearly = aloneYearly / SHARE_PEOPLE;
    const savedYearly = aloneYearly - splitYearly;
    return { aloneMonthly, aloneYearly, splitYearly, savedYearly };
  }, [count]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="h-5 w-5" />
          Сколько вы тратите
        </CardTitle>
        <CardDescription>
          Введите число подписок — покажем, сколько вы переплачиваете, оплачивая
          их в одиночку.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="subs-count">Подписок на вас</Label>
          <Input
            id="subs-count"
            type="number"
            inputMode="numeric"
            min={1}
            max={100}
            value={count}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              setCount(Number.isFinite(v) ? Math.max(1, Math.min(100, v)) : 1);
            }}
          />
        </div>

        <div className="space-y-2 rounded-lg border p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">В одиночку, в месяц</span>
            <span className="font-semibold tabular-nums">
              {formatMoney(Math.round(results.aloneMonthly * 100) / 100, "USD")}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">В одиночку, в год</span>
            <span className="font-semibold tabular-nums">
              {formatMoney(Math.round(results.aloneYearly * 100) / 100, "USD")}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              С SubSplit (на {SHARE_PEOPLE}), в год
            </span>
            <span className="font-semibold tabular-nums">
              {formatMoney(Math.round(results.splitYearly * 100) / 100, "USD")}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t pt-2">
            <span className="flex items-center gap-1.5 text-emerald-600">
              <TrendingDown className="h-4 w-4" />
              Вы экономите
            </span>
            <span className="font-bold tabular-nums text-emerald-600">
              {formatMoney(Math.round(results.savedYearly * 100) / 100, "USD")}
              /год
            </span>
          </div>
        </div>

        <Button asChild className="w-full">
          <a href="/login">Начать бесплатно</a>
        </Button>
      </CardContent>
    </Card>
  );
}
