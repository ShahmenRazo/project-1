"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowRight,
  CalendarDays,
  Repeat,
  Users,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateSubscriptionModal } from "@/components/subscriptions/create-subscription-modal";
import { UpsellModal } from "@/components/billing/upsell-modal";
import { onForegroundMessage } from "@/lib/push/client";
import { CATEGORY_LABELS } from "@/lib/constants";
import { LIMITS } from "@/lib/billing/plans";
import { formatMoney } from "@/lib/format";
import { roundMoney } from "@/lib/utils";
import type {
  DashboardProfile,
  DashboardSubscription,
} from "@/app/page";

/** Месячная стоимость подписки (yearly делится на 12) */
function monthlyPrice(sub: DashboardSubscription): number {
  return roundMoney(sub.billing_cycle === "monthly" ? sub.price : sub.price / 12);
}

export function DashboardShell({
  subscriptions,
  profile,
}: {
  subscriptions: DashboardSubscription[];
  profile: DashboardProfile;
}) {
  const totalPerMonth = useMemo(
    () => roundMoney(subscriptions.reduce((sum, s) => sum + monthlyPrice(s), 0)),
    [subscriptions]
  );

  const nextBillings = useMemo(
    () =>
      [...subscriptions].sort(
        (a, b) => a.billing_day - b.billing_day
      ),
    [subscriptions]
  );

  // --- Foreground FCM: показываем toast, когда приложение открыто ---
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    void onForegroundMessage(({ title, body, url }) => {
      if (!title) return;
      toast(title, {
        description: body,
        action: url
          ? {
              label: "Открыть",
              onClick: () => {
                window.location.href = url;
              },
            }
          : undefined,
      });
    }).then((unsub) => {
      unsubscribe = unsub;
    });
    return () => unsubscribe?.();
  }, []);

  // --- Freemium: на Free больше лимита добавлять нельзя — показываем upsell ---
  const isFree = profile.subscription_tier === "free";
  const atSubscriptionLimit =
    isFree && subscriptions.length >= LIMITS.free.max_subscriptions;
  const AddSubscriptionControl = atSubscriptionLimit ? (
    <UpsellModal feature="добавление 4-й подписки" />
  ) : (
    <CreateSubscriptionModal />
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Привет, {profile.display_name ?? profile.email.split("@")[0]}!
          </h1>
          <p className="text-sm text-muted-foreground">
            Управляйте подписками и делите расходы с друзьями
          </p>
          {isFree && (
            <p className="mt-1 text-xs text-muted-foreground">
              Free-тариф: {subscriptions.length}/{LIMITS.free.max_subscriptions}{" "}
              подписок ·{" "}
              <a href="/pricing" className="underline underline-offset-2">
                Перейти на Pro
              </a>
            </p>
          )}
        </div>
        {AddSubscriptionControl}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Расходы в месяц
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {formatMoney(totalPerMonth, "USD")}
            </p>
            <p className="text-xs text-muted-foreground">
              {subscriptions.length} подписок на учёте
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ближайшие списания
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {nextBillings.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Добавьте первую подписку
              </p>
            ) : (
              <ul className="space-y-1">
                {nextBillings.slice(0, 4).map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="truncate">
                      {s.name}{" "}
                      <span className="text-muted-foreground">
                        · {s.billing_day} числа
                      </span>
                    </span>
                    <span className="tabular-nums">
                      {formatMoney(monthlyPrice(s), s.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {subscriptions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Wallet className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-medium">Пока нет подписок</p>
              <p className="text-sm text-muted-foreground">
                Добавьте Netflix, Spotify или другую подписку, чтобы начать
                делиться с друзьями
              </p>
            </div>
            <CreateSubscriptionModal />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subscriptions.map((sub) => {
            const hasGroup = sub.group !== null;
            const isSharedCreator = sub.group?.creator_id === profile.id;
            return (
              <Card key={sub.id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{sub.name}</CardTitle>
                    <Badge variant={hasGroup ? "default" : "secondary"}>
                      {hasGroup
                        ? isSharedCreator
                          ? "Общая"
                          : "Участник"
                        : "Личная"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {CATEGORY_LABELS[sub.category]}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-semibold tabular-nums">
                      {formatMoney(sub.price, sub.currency)}
                    </span>
                    {sub.billing_cycle === "yearly" && (
                      <span className="text-xs text-muted-foreground">
                        /год (
                        {formatMoney(monthlyPrice(sub), sub.currency)}
                        /мес)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Repeat className="h-3.5 w-3.5" />
                    {sub.billing_cycle === "monthly"
                      ? "Ежемесячно"
                      : "Ежегодно"}
                    , списание {sub.billing_day} числа
                  </div>

                  {hasGroup && (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="mt-auto"
                    >
                      <Link href={`/groups/${sub.group!.id}`}>
                        <Users className="h-4 w-4" />
                        {sub.group!.name}
                        <ArrowRight className="ml-auto h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
