"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { apiErrorMessageAsync } from "@/lib/client-errors";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SubscriptionOption {
  id: string;
  name: string;
  price: number;
  currency: string;
}

interface MemberRow {
  email: string;
  share: string;
}

export function CreateGroupModal({ disabled = false }: { disabled?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [subscriptions, setSubscriptions] = useState<SubscriptionOption[]>([]);
  const [subscriptionId, setSubscriptionId] = useState("");
  const [name, setName] = useState("");
  const [members, setMembers] = useState<MemberRow[]>([
    { email: "", share: "" },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [membersOpen, setMembersOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function load() {
      setLoadingSubs(true);
      try {
        const res = await fetch("/api/subscriptions");
        if (!res.ok) throw new Error();
        const json = (await res.json()) as {
          data?: { id: string; name: string; price: number; currency: string }[];
        };
        if (!cancelled) setSubscriptions(json.data ?? []);
      } catch {
        if (!cancelled) toast.error("Failed to load subscriptions");
      } finally {
        if (!cancelled) setLoadingSubs(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [open]);

  function reset() {
    setName("");
    setSubscriptionId("");
    setMembers([{ email: "", share: "" }]);
    setErrors({});
  }

  function setMember(index: number, key: keyof MemberRow, value: string) {
    setMembers((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [key]: value } : m))
    );
  }

  function addMember() {
    setMembers((prev) => [...prev, { email: "", share: "" }]);
  }

  function removeMember(index: number) {
    setMembers((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    if (!subscriptionId) {
      nextErrors.subscription_id = "Choose a subscription";
    }
    if (!name.trim()) {
      nextErrors.name = "Enter a group name";
    }

    const membersPayload: { email: string; share_percent: number }[] = [];
    let shareSum = 0;
    members.forEach((m, i) => {
      if (!m.email.trim() && !m.share.trim()) return;
      if (!m.email.trim() || !/^\S+@\S+\.\S+$/.test(m.email.trim())) {
        nextErrors[`members.${i}.email`] = "Invalid email";
        return;
      }
      const share = Number(m.share);
      if (!Number.isFinite(share) || share <= 0) {
        nextErrors[`members.${i}.share`] = "Enter a share greater than 0";
        return;
      }
      membersPayload.push({
        email: m.email.trim(),
        share_percent: Math.round(share * 100) / 100,
      });
      shareSum += Math.round(share * 100) / 100;
    });

    if (shareSum >= 100) {
      nextErrors.share_sum = `Members' shares must total less than 100% (currently ${shareSum}%)`;
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          subscription_id: subscriptionId,
          members: membersPayload,
        }),
      });
      const json = (await res.json().catch(() => null)) as {
        data?: { group?: { id: string }; invited?: { email: string }[] };
        error?: { message?: string };
      } | null;

      if (!res.ok) {
        toast.error(await apiErrorMessageAsync(res, json?.error?.message ?? "Failed to create group"));
        return;
      }

      const invitedCount = json?.data?.invited?.length ?? 0;
      toast.success(
        invitedCount > 0
          ? "Group created, notifications sent to members"
          : "Group created"
      );
      trackEvent("create_group", { group_name: name.trim() });
      reset();
      setOpen(false);
      if (json?.data?.group?.id) {
        router.push(`/groups/${json.data.group.id}`);
      } else {
        router.refresh();
      }
    } catch {
      toast.error("Network error, please try again");
    } finally {
      setSaving(false);
    }
  }

  const shareError = errors.share_sum;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled} title={disabled ? "Verify your email first." : undefined}>
          <Users className="h-4 w-4" />
          Create group
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New group</DialogTitle>
          <DialogDescription>
            Pick a subscription and name the group — invite friends later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Subscription</Label>
            {loadingSubs ? (
              <Skeleton className="h-9 w-full" />
            ) : subscriptions.length === 0 ? (
              <p className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
                Add a subscription first — a group needs one
              </p>
            ) : (
              <Select
                value={subscriptionId}
                onValueChange={(v) => setSubscriptionId(v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a subscription" />
                </SelectTrigger>
                <SelectContent>
                  {subscriptions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} — {s.price} {s.currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.subscription_id && (
              <p className="text-xs text-destructive">{errors.subscription_id}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="group-name">Group name</Label>
            <Input
              id="group-name"
              placeholder="Family — Netflix"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="rounded-lg border">
            <button
              type="button"
              onClick={() => setMembersOpen((v) => !v)}
              className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium hover:bg-accent/40"
              aria-expanded={membersOpen}
            >
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Invite friends (optional)
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  membersOpen && "rotate-180"
                )}
              />
            </button>

            {membersOpen && (
              <div className="space-y-3 border-t p-3">
                <div className="flex items-center justify-between">
                  <Label>Members (email and share)</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addMember}
                    disabled={members.length >= 10}
                  >
                    <Plus className="h-4 w-4" /> Add
                  </Button>
                </div>

                {members.map((m, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="flex-1 space-y-1">
                      <Input
                        type="email"
                        placeholder="friend@example.com"
                        value={m.email}
                        onChange={(e) => setMember(i, "email", e.target.value)}
                        aria-invalid={!!errors[`members.${i}.email`]}
                      />
                      {errors[`members.${i}.email`] && (
                        <p className="text-xs text-destructive">
                          {errors[`members.${i}.email`]}
                        </p>
                      )}
                    </div>
                    <div className="w-24 space-y-1">
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        max="100"
                        placeholder="%"
                        value={m.share}
                        onChange={(e) => setMember(i, "share", e.target.value)}
                        aria-invalid={!!errors[`members.${i}.share`]}
                      />
                      {errors[`members.${i}.share`] && (
                        <p className="text-xs text-destructive">
                          {errors[`members.${i}.share`]}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-0.5 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeMember(i)}
                      disabled={members.length === 1}
                      aria-label="Remove member"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {shareError && (
                  <p className="text-xs text-destructive">{shareError}</p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button type="submit" disabled={saving || loadingSubs}>
              {saving ? "Creating…" : "Create group"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
