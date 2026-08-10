"use client";

import Link from "next/link";
import { ArrowRight, Minus, TrendingDown, TrendingUp, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateGroupModal } from "@/components/groups/create-group-modal";
import { formatMoney } from "@/lib/format";
import { roundMoney } from "@/lib/utils";
import type { DashboardGroup } from "@/lib/types";

export function GroupsSection({
  groups,
  loading,
}: {
  groups: DashboardGroup[];
  loading?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Мои группы</h2>
          <p className="text-sm text-muted-foreground">
            Делите подписки и следите за долгами
          </p>
        </div>
        <CreateGroupModal />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <Users className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-medium">Пока нет групп</p>
              <p className="text-sm text-muted-foreground">
                Создайте группу и добавьте друзей, чтобы делить подписку
              </p>
            </div>
            <CreateGroupModal />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <Card key={g.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{g.name}</CardTitle>
                  <Badge variant="secondary">{g.member_count} уч.</Badge>
                </div>
                <CardDescription className="truncate">
                  {g.subscription_name ?? "Общая подписка"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3">
                <div className="space-y-1.5 text-sm">
                  {g.owed_by_me > 0 && (
                    <p className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <TrendingUp className="h-4 w-4 text-destructive" />
                        Вы должны
                      </span>
                      <span className="font-semibold tabular-nums text-destructive">
                        {formatMoney(roundMoney(g.owed_by_me), g.currency)}
                      </span>
                    </p>
                  )}
                  {g.owed_to_me > 0 && (
                    <p className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <TrendingDown className="h-4 w-4 text-emerald-600" />
                        Вам должны
                      </span>
                      <span className="font-semibold tabular-nums text-emerald-600">
                        {formatMoney(roundMoney(g.owed_to_me), g.currency)}
                      </span>
                    </p>
                  )}
                  {g.owed_by_me === 0 && g.owed_to_me === 0 && (
                    <p className="flex items-center gap-1.5 text-muted-foreground">
                      <Minus className="h-4 w-4" />
                      Долгов нет
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Ваша доля: {g.my_share_percent}%
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="mt-auto">
                  <Link href={`/groups/${g.id}`}>
                    Открыть группу
                    <ArrowRight className="ml-auto h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
