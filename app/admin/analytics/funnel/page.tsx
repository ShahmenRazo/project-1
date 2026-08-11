import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin/guard";
import { AnalyticsTabs } from "@/components/admin/analytics-tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Funnel — SubSplit Admin",
};

export type FunnelStep = {
  step: string;
  count: number;
};

export default async function AdminFunnelPage() {
  await requireAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin.rpc("admin_funnel");
  if (error) throw error;

  const steps = (data as FunnelStep[]) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activation Funnel</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign Up → Add Subscription → Create Group → Invite Friend →
            Upgrade Pro.
          </p>
        </div>
        <AnalyticsTabs />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Funnel</CardTitle>
          <CardDescription>
            Step conversion = % of users who reached the previous step and
            continued to this one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {steps.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No funnel data yet.
            </p>
          ) : (
            <div className="space-y-6">
              {steps.map((step, i) => {
                const prevCount = i > 0 ? steps[i - 1].count : null;
                const conversion =
                  prevCount && prevCount > 0
                    ? ((step.count / prevCount) * 100).toFixed(1)
                    : null;
                const overall =
                  steps.length > 0 && steps[0].count > 0
                    ? ((step.count / steps[0].count) * 100).toFixed(1)
                    : null;

                return (
                  <div key={step.step}>
                    <div className="flex items-baseline justify-between gap-2">
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">
                          {i + 1}.
                        </span>{" "}
                        <span className="font-semibold">{step.step}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold">
                          {step.count.toLocaleString()}
                        </span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {overall !== null ? `of total ${overall}%` : ""}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${
                            prevCount && prevCount > 0
                              ? (step.count / prevCount) * 100
                              : 100
                          }%`,
                        }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {i === 0
                        ? "all registered users"
                        : conversion !== null
                          ? `${conversion}% convert from «${steps[i - 1].step}»`
                          : "no users at previous step"}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Step details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Step</TableHead>
                <TableHead className="text-right">Users</TableHead>
                <TableHead className="text-right">
                  Conversion (prev step)
                </TableHead>
                <TableHead className="text-right">% of Sign Up</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {steps.map((step, i) => {
                const prevCount = i > 0 ? steps[i - 1].count : null;
                const conversion =
                  prevCount && prevCount > 0
                    ? ((step.count / prevCount) * 100).toFixed(1)
                    : "—";
                const overall =
                  steps.length > 0 && steps[0].count > 0
                    ? ((step.count / steps[0].count) * 100).toFixed(1)
                    : "—";
                return (
                  <TableRow key={step.step}>
                    <TableCell className="text-muted-foreground">
                      {i + 1}
                    </TableCell>
                    <TableCell className="font-medium">{step.step}</TableCell>
                    <TableCell className="text-right">
                      {step.count.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">{conversion}%</TableCell>
                    <TableCell className="text-right">{overall}%</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
