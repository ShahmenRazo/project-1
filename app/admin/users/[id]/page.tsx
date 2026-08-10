"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Copy, KeyRound, Link2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface UserDetail {
  profile: {
    id: string;
    email: string;
    display_name: string | null;
    avatar_url: string | null;
    subscription_tier: "free" | "pro";
    plan_status: string | null;
    role: "user" | "admin";
    country: string | null;
    last_active: string | null;
    created_at: string;
  };
  subscriptions: {
    id: string;
    name: string;
    category: string;
    price: number;
    currency: string;
    billing_cycle: string;
    billing_day: number;
    created_at: string;
  }[];
  groups: {
    id: string;
    name: string;
    created_at?: string;
  }[];
  payments: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    created_at: string;
    group_name: string | null;
    from_email: string | null;
    from_name: string | null;
    to_email: string | null;
    to_name: string | null;
  }[];
}

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [impersonating, setImpersonating] = useState(false);
  const [magicLink, setMagicLink] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${params.id}`);
      if (res.status === 404) {
        setError("User not found");
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const json = (await res.json()) as { data: UserDetail };
      setDetail(json.data);
    } catch {
      setError("Failed to load user");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleImpersonate() {
    setImpersonating(true);
    try {
      const res = await fetch(`/api/admin/users/${params.id}/impersonate`, {
        method: "POST",
      });
      const json = (await res.json().catch(() => null)) as {
        data?: { url: string };
        error?: { message?: string };
      } | null;
      if (!res.ok || !json?.data?.url) {
        toast.error(json?.error?.message ?? "Failed to generate magic link");
        return;
      }
      setMagicLink(json.data.url);
    } catch {
      toast.error("Network error, please try again");
    } finally {
      setImpersonating(false);
    }
  }

  async function copyMagicLink() {
    if (!magicLink) return;
    try {
      await navigator.clipboard.writeText(magicLink);
      toast.success("Link copied");
    } catch {
      toast.error("Failed to copy");
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${params.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        toast.error(json?.error?.message ?? "Failed to delete user");
        return;
      }
      toast.success("Account deleted");
      router.push("/admin/users");
    } catch {
      toast.error("Network error, please try again");
    } finally {
      setDeleting(false);
    }
  }

  const [togglingPro, setTogglingPro] = useState(false);

  async function handleTogglePro() {
    if (!detail) return;
    setTogglingPro(true);
    try {
      const res = await fetch(`/api/admin/users/${params.id}/toggle-pro`, {
        method: "POST",
      });
      const json = (await res.json().catch(() => null)) as {
        data?: { pro: boolean };
        error?: { message?: string };
      } | null;
      if (!res.ok || !json?.data) {
        toast.error(json?.error?.message ?? "Failed to update plan");
        return;
      }
      setDetail({
        ...detail,
        profile: {
          ...detail.profile,
          subscription_tier: json.data.pro ? "pro" : "free",
          plan_status: json.data.pro ? "active" : "none",
        },
      });
      toast.success(json.data.pro ? "Pro enabled" : "Pro disabled");
    } catch {
      toast.error("Network error, please try again");
    } finally {
      setTogglingPro(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !detail) {
    return <p className="text-sm text-destructive">{error ?? "Not found"}</p>;
  }

  const p = detail.profile;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{p.email}</h1>
          <p className="text-sm text-muted-foreground">
            {p.display_name ?? "No display name"} · joined {fmt(p.created_at)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleTogglePro} disabled={togglingPro}>
            {p.subscription_tier === "pro" ? "Revoke Pro" : "Give Pro"}
          </Button>
          <Button variant="outline" onClick={handleImpersonate} disabled={impersonating}>
            <KeyRound className="h-4 w-4" />
            {impersonating ? "Generating…" : "Impersonate"}
          </Button>
          <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="h-4 w-4" /> Delete account
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan</span>
              <Badge variant={p.subscription_tier === "pro" ? "default" : "secondary"}>
                {p.subscription_tier === "pro" ? "Pro" : "Free"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">LS status</span>
              <span className="tabular-nums">{p.plan_status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium">{p.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Country</span>
              <span>{p.country ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last active</span>
              <span className="tabular-nums">{fmt(p.last_active)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Subscriptions ({detail.subscriptions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {detail.subscriptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No subscriptions</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {detail.subscriptions.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">
                      {s.name}{" "}
                      <span className="font-normal text-muted-foreground">· {s.category}</span>
                    </span>
                    <span className="tabular-nums">
                      {formatMoney(s.price, s.currency)}/{s.billing_cycle === "yearly" ? "yr" : "mo"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Groups ({detail.groups.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {detail.groups.length === 0 ? (
            <p className="text-sm text-muted-foreground">No groups</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {detail.groups.map((g) => (
                <Badge key={g.id} variant="secondary">
                  {g.name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payments ({detail.payments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                    No payments
                  </TableCell>
                </TableRow>
              ) : (
                detail.payments.map((pay) => (
                  <TableRow key={pay.id}>
                    <TableCell>{pay.from_email ?? "—"}</TableCell>
                    <TableCell>{pay.to_email ?? "—"}</TableCell>
                    <TableCell className="tabular-nums">
                      {formatMoney(pay.amount, pay.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={pay.status === "paid" ? "default" : "destructive"}>
                        {pay.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {fmt(pay.created_at)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!magicLink} onOpenChange={(open) => !open && setMagicLink(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Impersonation link</DialogTitle>
            <DialogDescription>
              Open this link in an incognito window to sign in as this user. The
              link works once and expires shortly.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-2">
            <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="min-w-0 flex-1 truncate text-xs">{magicLink}</p>
            <Button size="sm" variant="outline" onClick={copyMagicLink}>
              <Copy className="h-4 w-4" /> Copy
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete account?</DialogTitle>
            <DialogDescription>
              This permanently deletes {p.email} and all their data (groups,
              subscriptions, payments, notifications). This cannot be undone
              (GDPR).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete forever"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
