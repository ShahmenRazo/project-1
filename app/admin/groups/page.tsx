"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";

interface AdminGroup {
  id: string;
  name: string;
  created_at: string;
  creator_email: string | null;
  creator_name: string | null;
  creator_plan: "free" | "pro";
  member_count: number;
  subscription: {
    name: string;
    price: number;
    currency: string;
    billing_cycle: string;
  } | null;
}

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<AdminGroup[]>([]);
  const [plan, setPlan] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (plan !== "all") params.set("plan", plan);
      const res = await fetch(`/api/admin/groups?${params}`);
      if (!res.ok) throw new Error(String(res.status));
      const json = (await res.json()) as { data: { groups: AdminGroup[] } };
      setGroups(json.data.groups);
    } catch {
      setError("Failed to load groups");
    } finally {
      setLoading(false);
    }
  }, [plan]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Groups</h1>
          <p className="text-sm text-muted-foreground">{groups.length} shown</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Creator plan:</span>
          <Select value={plan} onValueChange={setPlan}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Creator</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Created</TableHead>
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
              ) : groups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    No groups found
                  </TableCell>
                </TableRow>
              ) : (
                groups.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {g.creator_name ?? g.creator_email ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={g.creator_plan === "pro" ? "default" : "secondary"}>
                        {g.creator_plan === "pro" ? "Pro" : "Free"}
                      </Badge>
                    </TableCell>
                    <TableCell className="tabular-nums">{g.member_count}</TableCell>
                    <TableCell>{g.subscription?.name ?? "—"}</TableCell>
                    <TableCell className="tabular-nums">
                      {g.subscription
                        ? formatMoney(g.subscription.price, g.subscription.currency)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {new Date(g.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
