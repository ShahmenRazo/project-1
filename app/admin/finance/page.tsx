"use client";

import { useCallback, useEffect, useState } from "react";
import { DollarSign, RotateCcw, TrendingUp, Wallet, XCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface FinanceOrder {
  id: string;
  email: string | null;
  amount: number;
  currency: string;
  status: "succeeded" | "failed" | "refunded";
  payment_method: string;
  invoice_id: string | null;
  created_at: string;
}

interface FinanceSummary {
  total_revenue: number;
  revenue_this_month: number;
  refunds: number;
  net_revenue: number;
}

function fmtMoney(n: number): string {
  return `$${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const STATUS_BADGE: Record<FinanceOrder["status"], { label: string; cls: string }> = {
  succeeded: { label: "Succeeded", cls: "bg-emerald-100 text-emerald-700" },
  failed: { label: "Failed", cls: "bg-red-100 text-red-700" },
  refunded: { label: "Refunded", cls: "bg-amber-100 text-amber-700" },
};

export default function AdminFinancePage() {
  const [orders, setOrders] = useState<FinanceOrder[]>([]);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refundingId, setRefundingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/finance");
      if (!res.ok) throw new Error(String(res.status));
      const json = (await res.json()) as { data: { summary: FinanceSummary; orders: FinanceOrder[] } };
      setSummary(json.data.summary);
      setOrders(json.data.orders);
    } catch {
      setError("Failed to load finance data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRefund(order: FinanceOrder) {
    if (!window.confirm(`Refund ${fmtMoney(order.amount)} for ${order.email}?`)) return;
    setRefundingId(order.id);
    try {
      const res = await fetch("/api/admin/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message ?? String(res.status));
      toast.success("Refund processed");
      await load();
    } catch (err) {
      toast.error(`Failed: ${err instanceof Error ? err.message : "error"}`);
    } finally {
      setRefundingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Finance</h1>
        <p className="text-sm text-muted-foreground">
          Pro payments via LemonSqueezy.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {loading ? "—" : fmtMoney(summary?.total_revenue ?? 0)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">lifetime</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue This Month
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {loading ? "—" : fmtMoney(summary?.revenue_this_month ?? 0)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">succeeded only</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Refunds
            </CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {loading ? "—" : fmtMoney(summary?.refunds ?? 0)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">total refunded</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {loading ? "—" : fmtMoney(summary?.net_revenue ?? 0)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">gross − refunds</p>
          </CardContent>
        </Card>
      </div>

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment method</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Invoice ID</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    No transactions yet
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((o) => {
                  const badge = STATUS_BADGE[o.status];
                  return (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium">{o.email ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {fmtMoney(o.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge className={badge.cls}>{badge.label}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {o.payment_method}
                      </TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {new Date(o.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {o.invoice_id ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {o.status === "succeeded" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void handleRefund(o)}
                            disabled={refundingId === o.id}
                          >
                            {refundingId === o.id ? (
                              <RotateCcw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            Refund
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
