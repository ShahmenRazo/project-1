import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin/guard";
import { AnalyticsTabs } from "@/components/admin/analytics-tabs";
import { KpiCards, type KpiData } from "@/components/admin/kpi-cards";
import { GrowthChart, type GrowthPoint } from "@/components/admin/growth-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Analytics — SubSplit Admin",
};

export default async function AdminAnalyticsPage() {
  await requireAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin.rpc("admin_kpi");
  if (error) throw error;

  const kpi = data as KpiData & { growth_90d: GrowthPoint[] };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Growth, activity and revenue — computed via Supabase RPC.
          </p>
        </div>
        <AnalyticsTabs />
      </div>

      <KpiCards kpi={kpi} />

      <Card>
        <CardHeader>
          <CardTitle>User growth — last 90 days</CardTitle>
          <CardDescription>
            New registrations per day (users.created_at).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GrowthChart data={kpi.growth_90d} />
        </CardContent>
      </Card>
    </div>
  );
}
