"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Ban,
  Eye,
  RotateCcw,
  Search,
  Trash2,
  UserRound,
  UserRoundCog,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

interface AdminUser {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  subscription_tier: "free" | "pro";
  plan_status: string;
  role: "user" | "admin";
  banned: boolean;
  is_beta: boolean;
  created_at: string;
  last_active: string | null;
  subscriptions_count: number;
  groups_count: number;
  revenue: number;
}

const PAGE_SIZES = [10, 25, 50];

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtMoney(n: number): string {
  return n > 0 ? `$${n.toFixed(2)}` : "—";
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [q, setQ] = useState("");
  const [plan, setPlan] = useState("all");
  const [status, setStatus] = useState("all");
  const [days, setDays] = useState("0");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        plan,
        status,
        days,
      });
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error(String(res.status));
      const json = (await res.json()) as {
        data: { users: AdminUser[]; total: number };
      };
      setUsers(json.data.users);
      setTotal(json.data.total);
    } catch {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, q, plan, status, days]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setBanned(u: AdminUser, banned: boolean) {
    setBusyId(u.id);
    try {
      const res = await fetch(
        `/api/admin/users/${u.id}/${banned ? "ban" : "unban"}`,
        { method: "POST" }
      );
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message ?? String(res.status));
      toast.success(banned ? `${u.email} banned` : `${u.email} unbanned`);
      await load();
    } catch (err) {
      toast.error(`Failed: ${err instanceof Error ? err.message : "error"}`);
    } finally {
      setBusyId(null);
    }
  }

  async function handleImpersonate(u: AdminUser) {
    setBusyId(u.id);
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: u.id }),
      });
      const json = (await res.json()) as { login_url?: string; error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message ?? String(res.status));
      if (json.login_url) window.open(json.login_url, "_blank");
      toast.success(`Impersonating ${u.email} (15 min)`);
    } catch (err) {
      toast.error(`Failed: ${err instanceof Error ? err.message : "error"}`);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(u: AdminUser) {
    if (!window.confirm(`Permanently delete ${u.email}? This removes all their data (GDPR).`)) return;
    setBusyId(u.id);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message ?? String(res.status));
      toast.success(`${u.email} deleted`);
      await load();
    } catch (err) {
      toast.error(`Failed: ${err instanceof Error ? err.message : "error"}`);
    } finally {
      setBusyId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

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

      {/* Фильтры: план / статус / период */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={plan} onValueChange={(v) => { setPlan(v); setPage(1); }}>
          <SelectTrigger className="h-9 w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All plans</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="h-9 w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
          </SelectContent>
        </Select>
        <Select value={days} onValueChange={(v) => { setDays(v); setPage(1); }}>
          <SelectTrigger className="h-9 w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">All time</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last active</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Groups</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id} className={u.banned ? "opacity-70" : undefined}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        {u.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={u.avatar_url}
                            alt=""
                            className="h-8 w-8 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                            <UserRound className="h-4 w-4 text-muted-foreground" />
                          </span>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate font-medium">
                              {u.display_name || u.email}
                            </span>
                            {u.role === "admin" && (
                              <Badge variant="secondary" className="shrink-0 text-[10px]">
                                admin
                              </Badge>
                            )}
                          </div>
                          {u.display_name && (
                            <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {fmtDate(u.created_at)}
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {fmtDate(u.last_active)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.subscription_tier === "pro" ? "default" : "secondary"}>
                        {u.subscription_tier === "pro" ? "Pro" : "Free"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmtMoney(u.revenue)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {u.groups_count}
                    </TableCell>
                    <TableCell>
                      {u.banned ? (
                        <Badge variant="destructive">Banned</Badge>
                      ) : (
                        <Badge variant="outline" className="text-emerald-600">
                          Active
                        </Badge>
                      )}
                      {u.is_beta && (
                        <Badge className="ml-1.5 bg-violet-100 text-violet-700">
                          Beta
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" disabled={busyId === u.id}>
                            {busyId === u.id ? (
                              <RotateCcw className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{u.email}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/users/${u.id}`}>
                              <Eye className="mr-2 h-4 w-4" /> View profile
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => void handleImpersonate(u)}>
                            <UserRoundCog className="mr-2 h-4 w-4" /> Impersonate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {u.banned ? (
                            <DropdownMenuItem onSelect={() => void setBanned(u, false)}>
                              <RotateCcw className="mr-2 h-4 w-4" /> Unban
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onSelect={() => void setBanned(u, true)}>
                              <Ban className="mr-2 h-4 w-4" /> Ban
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={() => void handleDelete(u)}
                            disabled={u.role === "admin"}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete (GDPR)
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground tabular-nums">
          Page {page} of {totalPages}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              setPageSize(Number(v));
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((s) => (
                <SelectItem key={s} value={String(s)}>
                  {s} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
