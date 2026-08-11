"use client";

import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  UserMinus,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type KpiData = {
  total_users: number;
  mau: number;
  wau: number;
  dau: number;
  mrr: number;
  churn_rate: number;
};

const CARD_STYLE =
  "transition-shadow hover:shadow-md";

function KpiCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className={CARD_STYLE}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

/** 6 KPI-карточек: Total Users, MAU, WAU, DAU, MRR, Churn */
export function KpiCards({ kpi }: { kpi: KpiData }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <KpiCard
        label="Total Users"
        value={kpi.total_users.toLocaleString()}
        sub="all time"
        icon={<Users className="h-4 w-4" />}
      />
      <KpiCard
        label="MAU"
        value={kpi.mau.toLocaleString()}
        sub="last 30 days"
        icon={<Users className="h-4 w-4" />}
      />
      <KpiCard
        label="WAU"
        value={kpi.wau.toLocaleString()}
        sub="last 7 days"
        icon={<Users className="h-4 w-4" />}
      />
      <KpiCard
        label="DAU"
        value={kpi.dau.toLocaleString()}
        sub="today"
        icon={<TrendingUp className="h-4 w-4" />}
      />
      <KpiCard
        label="MRR"
        value={`$${kpi.mrr.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`}
        sub="pro users × $3.99"
        icon={<DollarSign className="h-4 w-4" />}
      />
      <KpiCard
        label="Churn Rate"
        value={`${kpi.churn_rate}%`}
        sub="expired pro / total pro"
        icon={<UserMinus className="h-4 w-4" />}
      />
    </div>
  );
}

export function TrendBadge({ delta }: { delta: number }) {
  const up = delta >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        up
          ? "bg-emerald-100 text-emerald-700"
          : "bg-red-100 text-red-700"
      }`}
    >
      {up ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {up ? "+" : ""}
      {delta.toFixed(1)}%
    </span>
  );
}
