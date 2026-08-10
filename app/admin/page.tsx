"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, CalendarPlus, DollarSign, Users, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney } from "@/lib/format";

interface Stats {
  total_users: number;
  active_today: number;
  new_this_week: number;
  pro_users: number;
  mrr: number;
  growth: { date: string; count: number }[];
  recent_registrations: {
    id: string;
    email: string;
    created_at: string;
    subscription_tier: "free" | "pro";
  }[];
  top_subscriptions: { name: string; count: number }[];
  top_countries: { country: string; count: number }[];
}

function shortDate(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/stats")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((json) => !cancelled && setStats(json.data))
      .catch(() => !cancelled && setError("Failed to load stats"));
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  const cards = [
    { label: "Total users", value: stats?.total_users, icon: Users },
    { label: "Active today", value: stats?.active_today, icon: Activity },
    { label: "New this week", value: stats?.new_this_week, icon: CalendarPlus },
    { label: "Pro users", value: stats?.pro_users, icon: UserCheck },
    { label: "MRR", value: stats ? formatMoney(stats.mrr, "USD") : undefined, icon: DollarSign },
  ];

  const maxGrowth = stats ? Math.max(1, ...stats.growth.map((g) => g.count)) : 1;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {c.label}
              </CardTitle>
              <c.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {stats ? (
                <p className="text-2xl font-semibold tabular-nums">{c.value}</p>
              ) : (
                <Skeleton className="h-7 w-16" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">User growth — last 30 days</CardTitle>
          </CardHeader>
          <CardContent>
            {stats ? (
              <>
                <div className="flex h-40 items-end gap-1.5">
                {stats.growth.map((g) => (
                  <div
                    key={g.date}
                    className="group relative flex flex-1 flex-col justify-end"
                  >
                    <div
                      className="rounded-t bg-primary/80 transition-colors group-hover:bg-primary"
                      style={{ height: `${(g.count / maxGrowth) * 100}%`, minHeight: g.count > 0 ? 4 : 1 }}
                    />
                    <div className="pointer-events-none absolute -top-7 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded border bg-background px-1.5 py-0.5 text-[10px] shadow opacity-0 transition-opacity group-hover:opacity-100">
                      {shortDate(g.date)}: {g.count}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                <span>{shortDate(stats.growth[0]?.date ?? "")}</span>
                <span>{shortDate(stats.growth[stats.growth.length - 1]?.date ?? "")}</span>
              </div>
              </>
            ) : (
              <Skeleton className="h-40 w-full" />
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top subscriptions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats ? (
                stats.top_subscriptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data yet</p>
                ) : (
                  stats.top_subscriptions.map((s, i) => (
                    <div key={s.name} className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex items-center gap-2 truncate">
                        <span className="text-xs text-muted-foreground tabular-nums">{i + 1}</span>
                        <span className="truncate font-medium">{s.name}</span>
                      </span>
                      <span className="tabular-nums text-muted-foreground">{s.count}</span>
                    </div>
                  ))
                )
              ) : (
                <Skeleton className="h-24 w-full" />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top countries</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats ? (
                stats.top_countries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data yet</p>
                ) : (
                  stats.top_countries.map((c, i) => (
                    <div key={c.country} className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground tabular-nums">{i + 1}</span>
                        <span className="font-medium">{c.country}</span>
                      </span>
                      <span className="tabular-nums text-muted-foreground">{c.count}</span>
                    </div>
                  ))
                )
              ) : (
                <Skeleton className="h-24 w-full" />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent registrations</CardTitle>
        </CardHeader>
        <CardContent>
          {stats ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Registered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recent_registrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-6 text-center text-sm text-muted-foreground">
                      No registrations yet
                    </TableCell>
                  </TableRow>
                ) : (
                  stats.recent_registrations.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <Link
                          href={`/admin/users/${u.id}`}
                          className="font-medium underline-offset-2 hover:underline"
                        >
                          {u.email}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.subscription_tier === "pro" ? "default" : "secondary"}>
                          {u.subscription_tier === "pro" ? "Pro" : "Free"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground tabular-nums">
                        {shortDate(u.created_at.slice(0, 10))}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          ) : (
            <Skeleton className="h-40 w-full" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
