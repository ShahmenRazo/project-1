"use client";

import { useCallback, useEffect, useState } from "react";
import { ScrollText } from "lucide-react";
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

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  target_id: string | null;
  target_email: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
  users: { email: string | null } | null;
}

const ACTIONS: Record<string, { label: string; cls: string }> = {
  ban_user: { label: "ban_user", cls: "bg-red-100 text-red-700" },
  unban_user: { label: "unban_user", cls: "bg-emerald-100 text-emerald-700" },
  delete_user: { label: "delete_user", cls: "bg-red-100 text-red-700" },
  impersonate: { label: "impersonate", cls: "bg-violet-100 text-violet-700" },
  refund: { label: "refund", cls: "bg-amber-100 text-amber-700" },
  toggle_pro: { label: "toggle_pro", cls: "bg-blue-100 text-blue-700" },
};

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "50" });
      if (action !== "all") params.set("action", action);
      const res = await fetch(`/api/admin/audit?${params}`);
      if (!res.ok) throw new Error(String(res.status));
      const json = (await res.json()) as {
        data: { logs: AuditLog[]; total: number };
      };
      setLogs(json.data.logs);
      setTotal(json.data.total);
    } catch {
      setError("Failed to load audit log");
    } finally {
      setLoading(false);
    }
  }, [page, action]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / 50));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Audit Log</h1>
          <p className="text-sm text-muted-foreground">
            Admin actions: {total} recorded
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-muted-foreground" />
          <Select
            value={action}
            onValueChange={(v) => {
              setAction(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              {Object.keys(ACTIONS).map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
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
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    No admin actions yet
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const meta = ACTIONS[log.action];
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">
                        {log.users?.email ?? "—"}
                      </TableCell>
                      <TableCell>
                        {meta ? (
                          <Badge className={meta.cls}>{meta.label}</Badge>
                        ) : (
                          <Badge variant="secondary">{log.action}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {log.target_email ??
                          (log.metadata && log.metadata.order_id
                            ? `order ${String(log.metadata.order_id).slice(0, 8)}…`
                            : "—")}
                      </TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {fmtDateTime(log.created_at)}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {log.ip_address ?? "—"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground tabular-nums">
          Page {page} of {totalPages}
        </p>
        <div className="flex items-center gap-2">
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
