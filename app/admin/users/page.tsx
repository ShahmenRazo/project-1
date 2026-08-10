"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminUser {
  id: string;
  email: string;
  display_name: string | null;
  subscription_tier: "free" | "pro";
  plan_status: string;
  role: "user" | "admin";
  created_at: string;
  last_active: string | null;
  subscriptions_count: number;
  groups_count: number;
}

const PAGE_SIZE = 25;

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error(String(res.status));
      const json = (await res.json()) as { data: { users: AdminUser[]; total: number } };
      setUsers(json.data.users);
      setTotal(json.data.total);
    } catch {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, q]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">{total} total</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
          }}
          className="flex w-full max-w-sm items-center gap-2"
        >
          <Input
            placeholder="Search by email…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search users"
          />
          <Button type="submit" size="icon" variant="outline" aria-label="Search">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Last active</TableHead>
                <TableHead>Groups</TableHead>
                <TableHead>Subs</TableHead>
                <TableHead className="text-right">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{u.email}</span>
                        {u.role === "admin" && (
                          <Badge variant="secondary" className="text-[10px]">
                            admin
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {fmtDate(u.created_at)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.subscription_tier === "pro" ? "default" : "secondary"}>
                        {u.subscription_tier === "pro" ? "Pro" : "Free"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {fmtDate(u.last_active)}
                    </TableCell>
                    <TableCell className="tabular-nums">{u.groups_count}</TableCell>
                    <TableCell className="tabular-nums">{u.subscriptions_count}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/users/${u.id}`}>
                          <Eye className="h-4 w-4" /> View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground tabular-nums">
          Page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
