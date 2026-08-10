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
import { Slider } from "@/components/ui/slider";
import { formatMoney } from "@/lib/format";

// ---------- Copy (US market) ----------
const COPY = {
  title: "Savings Calculator",
  subtitle: "See exactly what you keep when you split with your people.",
  subsLabel: "How many subscriptions do you pay for alone?",
  subsHint: (n: number) => (n === 1 ? "subscription" : "subscriptions"),
  priceLabel: "Average subscription:",
  splitLabel: "Split between",
  splitHint: (n: number) => (n === 1 ? "person" : "people"),
  rowAlone: "You pay alone:",
  rowSplit: "With SubSplit:",
  rowSaved: "You save:",
  perMonth: "/mo",
  perYear: "/year",
  cta: "Start saving now",
};

const MIN_SUBS = 1;
const MAX_SUBS = 15;
const DEFAULT_SUBS = 5;
const MIN_PEOPLE = 2;
const MAX_PEOPLE = 6;
const DEFAULT_PEOPLE = 4;
const DEFAULT_PRICE = 12.99;

export function SavingsCalculator() {
  const [count, setCount] = useState(DEFAULT_SUBS);
  const [price, setPrice] = useState(DEFAULT_PRICE);
  const [people, setPeople] = useState(DEFAULT_PEOPLE);

  const results = useMemo(() => {
    const aloneMonthly = price * count;
    const aloneYearly = aloneMonthly * 12;
    const splitYearly = aloneYearly / people;
    const savedYearly = aloneYearly - splitYearly;
    return { aloneMonthly, aloneYearly, splitYearly, savedYearly };
  }, [count, price, people]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="h-5 w-5" />
          {COPY.title}
        </CardTitle>
        <CardDescription>{COPY.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <Label htmlFor="subs-count">{COPY.subsLabel}</Label>
            <span className="text-sm font-semibold tabular-nums">
              {count} {COPY.subsHint(count)}
            </span>
          </div>
          <Slider
            id="subs-count"
            min={MIN_SUBS}
            max={MAX_SUBS}
            step={1}
            value={[count]}
            onValueChange={([v]) => setCount(v)}
            aria-label={COPY.subsLabel}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subs-price">{COPY.priceLabel}</Label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
              $
            </span>
            <Input
              id="subs-price"
              type="number"
              inputMode="decimal"
              min={1}
              max={99}
              step={0.01}
              className="pl-7"
              value={price}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setPrice(
                  Number.isFinite(v) ? Math.max(1, Math.min(99, v)) : 1
                );
              }}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <Label htmlFor="people-count">{COPY.splitLabel}</Label>
            <span className="text-sm font-semibold tabular-nums">
              {people} {COPY.splitHint(people)}
            </span>
          </div>
          <Slider
            id="people-count"
            min={MIN_PEOPLE}
            max={MAX_PEOPLE}
            step={1}
            value={[people]}
            onValueChange={([v]) => setPeople(v)}
            aria-label={COPY.splitLabel}
          />
        </div>

        <div className="space-y-2 rounded-lg border p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{COPY.rowAlone}</span>
            <span className="font-semibold tabular-nums">
              {formatMoney(results.aloneMonthly, "USD")}
              <span className="text-xs font-normal text-muted-foreground">
                {COPY.perMonth}
              </span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{COPY.rowSplit}</span>
            <span className="font-semibold tabular-nums">
              {formatMoney(results.splitYearly / 12, "USD")}
              <span className="text-xs font-normal text-muted-foreground">
                {COPY.perMonth}
              </span>
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t pt-2">
            <span className="flex items-center gap-1.5 text-emerald-600">
              <TrendingDown className="h-4 w-4" />
              {COPY.rowSaved}
            </span>
            <span className="font-bold tabular-nums text-emerald-600">
              {formatMoney(results.savedYearly, "USD")}
              <span className="text-xs font-normal">
                {COPY.perYear}
              </span>
            </span>
          </div>
        </div>

        <Button asChild className="w-full">
          <a href="/login">{COPY.cta}</a>
        </Button>
      </CardContent>
    </Card>
  );
}
