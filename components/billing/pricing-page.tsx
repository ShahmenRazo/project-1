"use client";

import { Check, Crown, ExternalLink, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FREE_PLAN, PRO_PLAN } from "@/lib/billing/plans";
import { useCheckout } from "@/lib/billing/use-checkout";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SubscriptionTier } from "@/lib/database.types";

interface PlanCardProps {
  name: string;
  price: number;
  currency: string;
  period: string | null;
  features: string[];
  featured?: boolean;
  isCurrent: boolean;
  onUpgrade: () => void;
  upgrading: boolean;
  portalUrl?: string;
}

function PlanCard({
  name,
  price,
  currency,
  period,
  features,
  featured = false,
  isCurrent,
  onUpgrade,
  upgrading,
  portalUrl,
}: PlanCardProps) {
  return (
    <Card
      className={cn(
        "flex flex-col",
        featured && "border-primary shadow-lg ring-1 ring-primary/20"
      )}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{name}</CardTitle>
          {featured && (
            <Badge>
              <Crown className="mr-1 h-3 w-3" />
              Популярный
            </Badge>
          )}
          {isCurrent && <Badge variant="secondary">Ваш план</Badge>}
        </div>
        <CardDescription>
          <span className="text-3xl font-semibold text-foreground">
            {price === 0
              ? "$0"
              : formatMoney(price, currency)}
          </span>
          <span className="ml-1 text-sm">
            {period ? `/ ${period}` : "навсегда"}
          </span>
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <ul className="space-y-2">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm">
              <Check
                className={cn(
                  "h-4 w-4 shrink-0",
                  featured ? "text-primary" : "text-muted-foreground"
                )}
              />
              {f}
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        {isCurrent ? (
          portalUrl ? (
            <Button asChild variant="outline" className="w-full">
              <a href={portalUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Управление подпиской
              </a>
            </Button>
          ) : (
            <Button variant="outline" className="w-full" disabled>
              Текущий план
            </Button>
          )
        ) : (
          <Button
            className="w-full"
            variant={featured ? "default" : "secondary"}
            onClick={onUpgrade}
            disabled={upgrading}
          >
            {upgrading && <Loader2 className="h-4 w-4 animate-spin" />}
            Перейти на {name}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export function PricingPage({
  currentTier,
  portalUrl,
  upgradeStatus,
}: {
  currentTier: SubscriptionTier;
  portalUrl?: string;
  upgradeStatus?: string;
}) {
  const { loading, startCheckout } = useCheckout();
  const isPro = currentTier === "pro";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Цены для команд от 2 человек
        </h1>
        <p className="mt-2 text-muted-foreground">
          Начните бесплатно — переходите на Pro, когда подписок станет больше
        </p>
      </div>

      {upgradeStatus === "success" && (
        <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-800">
          Платёж прошёл успешно — план Pro активирован!
        </div>
      )}

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <PlanCard
          name={FREE_PLAN.name}
          price={FREE_PLAN.price}
          currency={FREE_PLAN.currency}
          period={FREE_PLAN.period}
          features={FREE_PLAN.features}
          isCurrent={!isPro}
          onUpgrade={() => {}}
          upgrading={false}
        />

        <PlanCard
          name={PRO_PLAN.name}
          price={PRO_PLAN.price}
          currency={PRO_PLAN.currency}
          period={PRO_PLAN.period}
          features={PRO_PLAN.features}
          featured
          isCurrent={isPro}
          onUpgrade={startCheckout}
          upgrading={loading}
          portalUrl={portalUrl}
        />
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Отмена в любой момент. Возврат — в течение 14 дней, без вопросов.
      </p>
    </div>
  );
}
