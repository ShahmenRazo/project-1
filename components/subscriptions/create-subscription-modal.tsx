"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { subscriptionSchema } from "@/lib/schemas";
import { BILLING_DAYS, CATEGORIES, CATEGORY_LABELS, CURRENCIES } from "@/lib/constants";
import type { BillingCycle, SubscriptionCategory } from "@/lib/database.types";

const INITIAL_FORM = {
  name: "",
  category: "streaming" as SubscriptionCategory,
  price: "",
  currency: "USD",
  billing_cycle: "monthly" as BillingCycle,
  billing_day: "1",
};

export function CreateSubscriptionModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set<K extends keyof typeof INITIAL_FORM>(
    key: K,
    value: (typeof INITIAL_FORM)[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function reset() {
    setForm(INITIAL_FORM);
    setErrors({});
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const parsed = subscriptionSchema.safeParse({
      ...form,
      price: Number(form.price),
      billing_day: Number(form.billing_day),
    });

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors(
        Object.fromEntries(
          Object.entries(fieldErrors).map(([key, issues]) => [
            key,
            issues?.[0] ?? "",
          ])
        )
      );
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = (await res.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;

      if (!res.ok) {
        toast.error(await apiErrorMessageAsync(res, json?.error?.message ?? "Failed to create subscription"));
        return;
      }

      toast.success("Subscription added");
      reset();
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Network error, please try again");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Add subscription
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New subscription</DialogTitle>
          <DialogDescription>
            Netflix, Spotify, ChatGPT — anything you share with friends.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Netflix"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={form.category}
              onValueChange={(v) =>
                set("category", v as SubscriptionCategory)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="9.99"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                aria-invalid={!!errors.price}
              />
              {errors.price && (
                <p className="text-xs text-destructive">{errors.price}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Currency</Label>
              <Select
                value={form.currency}
                onValueChange={(v) => set("currency", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Billing period</Label>
              <Select
                value={form.billing_cycle}
                onValueChange={(v) =>
                  set("billing_cycle", v as BillingCycle)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Every month</SelectItem>
                  <SelectItem value="yearly">Once a year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Billing day</Label>
              <Select
                value={form.billing_day}
                onValueChange={(v) => set("billing_day", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BILLING_DAYS.map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      day {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
