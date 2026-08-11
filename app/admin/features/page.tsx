"use client";

import { useCallback, useEffect, useState } from "react";
import { Flag, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
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

type FlagTarget = "all" | "pro_only" | "beta_users";

interface FeatureFlag {
  name: string;
  enabled: boolean;
  rollout_percent: number;
  target: FlagTarget;
  created_at: string;
}

const TARGET_BADGE: Record<FlagTarget, { label: string; cls: string }> = {
  all: { label: "All users", cls: "bg-zinc-100 text-zinc-700" },
  pro_only: { label: "Pro only", cls: "bg-blue-100 text-blue-700" },
  beta_users: { label: "Beta", cls: "bg-violet-100 text-violet-700" },
};

export default function AdminFeaturesPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState<FlagTarget>("all");
  const [enabled, setEnabled] = useState(false);
  const [rollout, setRollout] = useState(100);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/features");
      if (!res.ok) throw new Error(String(res.status));
      const json = (await res.json()) as { data: { flags: FeatureFlag[] } };
      setFlags(json.data.flags);
    } catch {
      setError("Failed to load feature flags");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function patchFlag(
    flag: FeatureFlag,
    patch: Partial<Pick<FeatureFlag, "enabled" | "rollout_percent" | "target">>
  ) {
    setSaving(flag.name);
    try {
      const res = await fetch(`/api/admin/features/${encodeURIComponent(flag.name)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message ?? String(res.status));
      setFlags((prev) =>
        prev.map((f) => (f.name === flag.name ? { ...f, ...patch } : f))
      );
      toast.success(`Flag "${flag.name}" updated`);
    } catch (err) {
      toast.error(`Failed: ${err instanceof Error ? err.message : "error"}`);
      await load();
    } finally {
      setSaving(null);
    }
  }

  async function handleCreate() {
    const trimmed = name.trim();
    if (!/^[a-z0-9_]{2,50}$/.test(trimmed)) {
      toast.error("Name: a-z, 0-9, underscore (2-50 chars)");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/features", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, enabled, rollout_percent: rollout, target }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message ?? String(res.status));
      toast.success(`Flag "${trimmed}" created`);
      setOpen(false);
      setName("");
      setEnabled(false);
      setRollout(100);
      setTarget("all");
      await load();
    } catch (err) {
      toast.error(`Failed: ${err instanceof Error ? err.message : "error"}`);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(flag: FeatureFlag) {
    if (!window.confirm(`Delete flag "${flag.name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/features/${encodeURIComponent(flag.name)}`, {
        method: "DELETE",
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message ?? String(res.status));
      toast.success(`Flag "${flag.name}" deleted`);
      await load();
    } catch (err) {
      toast.error(`Failed: ${err instanceof Error ? err.message : "error"}`);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Feature Flags</h1>
          <p className="text-sm text-muted-foreground">
            Product switches: target + rollout. Applied via{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              useFeatureFlag(name)
            </code>
            .
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          New flag
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New feature flag</DialogTitle>
            <DialogDescription>
              Name like <span className="font-mono text-xs">new_dashboard</span> — the
              app checks it via <code className="font-mono text-xs">useFeatureFlag</code>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="flag-name">Name</Label>
              <Input
                id="flag-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="new_dashboard"
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label>Target users</Label>
              <Select
                value={target}
                onValueChange={(v) => setTarget(v as FlagTarget)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All users</SelectItem>
                  <SelectItem value="pro_only">Pro only</SelectItem>
                  <SelectItem value="beta_users">Beta users</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between gap-4">
              <Label>Enabled</Label>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Rollout</Label>
                <span className="text-sm font-medium tabular-nums">{rollout}%</span>
              </div>
              <Slider
                value={[rollout]}
                min={0}
                max={100}
                step={1}
                onValueChange={(v) => setRollout(v[0])}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleCreate()} disabled={creating}>
              {creating ? "Creating…" : "Create flag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[220px]">Name</TableHead>
                <TableHead className="w-[120px]">Target</TableHead>
                <TableHead className="w-[260px]">Rollout</TableHead>
                <TableHead className="w-[110px]">Enabled</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[60px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : flags.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    No feature flags yet
                  </TableCell>
                </TableRow>
              ) : (
                flags.map((flag) => {
                  const badge = TARGET_BADGE[flag.target];
                  return (
                    <TableRow key={flag.name}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Flag className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-mono text-sm font-medium">
                            {flag.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={badge.cls}>{badge.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Slider
                            value={[flag.rollout_percent]}
                            min={0}
                            max={100}
                            step={1}
                            disabled={saving === flag.name}
                            onValueCommit={(v) =>
                              void patchFlag(flag, { rollout_percent: v[0] })
                            }
                            className="w-40"
                          />
                          <span className="w-9 text-right text-sm tabular-nums text-muted-foreground">
                            {flag.rollout_percent}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={flag.enabled}
                          disabled={saving === flag.name}
                          onCheckedChange={(checked) =>
                            void patchFlag(flag, { enabled: checked })
                          }
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {new Date(flag.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => void handleDelete(flag)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
