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
  title: "Cohorts — SubSplit Admin",
};

export type Cohort = {
  cohort_month: string;
  users: number;
  week_1: number;
  week_2: number;
  week_4: number;
  week_8: number;
  week_12: number;
};

const WEEK_LABELS = ["Week 1", "Week 2", "Week 4", "Week 8", "Week 12"];
const WEEK_KEYS = ["week_1", "week_2", "week_4", "week_8", "week_12"] as const;

export default async function AdminCohortsPage() {
  await requireAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin.rpc("admin_cohorts");
  if (error) throw error;

  const cohorts = (data as Cohort[]) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cohort Analysis</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Retention by signup month — share of users still active N weeks
            after registration.
          </p>
        </div>
        <AnalyticsTabs />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Retention cohorts</CardTitle>
          <CardDescription>
            Survival retention: a user counts as retained at week N if their
            last activity (users.last_active, heartbeat) is on or after the
            end of week N.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cohorts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No cohorts yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cohort</TableHead>
                  <TableHead className="text-right">Users</TableHead>
                  {WEEK_LABELS.map((label) => (
                    <TableHead key={label} className="text-right">
                      {label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {cohorts.map((cohort) => (
                  <TableRow key={cohort.cohort_month}>
                    <TableCell className="font-medium">
                      {cohort.cohort_month}
                    </TableCell>
                    <TableCell className="text-right">
                      {cohort.users.toLocaleString()}
                    </TableCell>
                    {WEEK_KEYS.map((key) => {
                      const value = cohort[key];
                      return (
                        <TableCell key={key} className="text-right">
                          <span
                            className={
                              value > 0
                                ? "font-medium text-emerald-600"
                                : "text-muted-foreground"
                            }
                          >
                            {value > 0 ? `${value}%` : "—"}
                          </span>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
