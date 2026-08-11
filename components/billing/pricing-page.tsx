"use client";

import { useState } from "react";
import { Bell, Check, Crown, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
// Платёжный код (checkout) отключён на время beta — НЕ удалён, закомментирован.
// import { useCheckout } from "@/lib/billing/use-checkout";
// import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { SubscriptionTier } from "@/lib/database.types";

// ---------- Copy (US market) ----------
const COPY = {
  title: "Simple, fair pricing",
  subtitle:
    "Start free — upgrade to Pro when your group grows. Cancel anytime.",
  annualLabel: "Annual billing",
  annualSave: "Save 17%",
  currentPlan: "Current plan",
  manageSubscription: "Manage subscription",
  upgradeToPro: "Upgrade to Pro",
  getStartedFree: "Get Started Free",
  success: "Payment successful — Pro is active!",
  finePrint: "Cancel anytime, no questions asked.",
  faqTitle: "Frequently asked questions",
  plans: {
    free: {
      name: "Free",
      priceMonthly: 0,
      priceYearly: 0,
      period: "mo",
      features: [
        "Up to 3 subscriptions",
        "Up to 2 people per group",
        "Manual entry",
        "Basic reminders",
      ],
    },
    pro: {
      name: "Pro",
      badge: "Most Popular",
      priceMonthly: 3.99,
      priceYearly: 39.99,
      period: "mo",
      features: [
        "Unlimited subscriptions",
        "Up to 10 people per group",
        "Auto-import from email",
        "Smart meme reminders",
        "Usage analytics",
        "Priority support",
      ],
    },
  },
  faq: [
    {
      q: "How do my friends actually pay me?",
      a: "SubSplit tracks who owes what. Your friends pay you back via Venmo, Cash App, Zelle, or PayPal — whatever you already use.",
    },
    {
      q: "Is my subscription data secure?",
      a: "Yes. We use bank-level encryption. We never store your streaming passwords.",
    },
    {
      q: "What happens if a friend doesn't pay?",
      a: "We'll remind them (nicely at first, then with memes). You can also remove them from the group.",
    },
    {
      q: "Can I cancel Pro anytime?",
      a: "Absolutely. Cancel in one click, no questions asked.",
    },
    {
      q: "Do you handle the actual money transfer?",
      a: "No — we only track and remind. You keep using your favorite payment app.",
    },
  ],
} as const;

/** Платёжный UI ниже НЕ удалён — закомментирован до запуска Pro (см. render). */
function priceLabel(price: number, period: string): string {
  return price === 0 ? "$0" : `$${price.toFixed(2)}`;
}

interface PlanCardProps {
  plan: (typeof COPY.plans)["free"] | (typeof COPY.plans)["pro"];
  annual: boolean;
  featured?: boolean;
  isCurrent: boolean;
  onAction: () => void;
  actionLoading: boolean;
  portalUrl?: string;
  href?: string;
}

function PlanCard({
  plan,
  annual,
  featured = false,
  isCurrent,
  onAction,
  actionLoading,
  portalUrl,
  href,
}: PlanCardProps) {
  const price = annual ? plan.priceYearly : plan.priceMonthly;
  const ctaLabel = isCurrent
    ? COPY.currentPlan
    : featured
      ? COPY.upgradeToPro
      : COPY.getStartedFree;

  return (
    <Card
      className={cn(
        "flex flex-col",
        featured && "border-primary shadow-lg ring-1 ring-primary/20"
      )}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{plan.name}</CardTitle>
          {featured && (
            <Badge>
              <Crown className="mr-1 h-3 w-3" />
              {COPY.plans.pro.badge}
            </Badge>
          )}
          {isCurrent && <Badge variant="secondary">{COPY.currentPlan}</Badge>}
        </div>
        <CardDescription>
          <span className="text-3xl font-semibold text-foreground">
            {priceLabel(price, plan.period)}
          </span>
          <span className="ml-1 text-sm">
            /{annual && price > 0 ? "year" : plan.period}
          </span>
          {annual && price > 0 && (
            <span className="ml-2 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-xs font-medium text-emerald-600">
              {COPY.annualSave}
            </span>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <ul className="space-y-2">
          {plan.features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm">
              <Check
                className={cn(
                  "h-4 w-4 shrink-0",
                  featured ? "text-primary" : "text-muted-foreground"
                )}
              />
              {f}
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        {isCurrent ? (
          portalUrl && featured ? (
            <Button asChild variant="outline" className="w-full">
              <a href={portalUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                {COPY.manageSubscription}
              </a>
            </Button>
          ) : (
            <Button variant="outline" className="w-full" disabled>
              {COPY.currentPlan}
            </Button>
          )
        ) : href ? (
          <Button asChild className="w-full" variant="secondary">
            <a href={href}>{ctaLabel}</a>
          </Button>
        ) : (
          <Button
            className="w-full"
            variant={featured ? "default" : "secondary"}
            onClick={onAction}
            disabled={actionLoading}
          >
            {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {ctaLabel}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export function PricingPage({
  currentTier,
  portalUrl,
  upgradeStatus,
  authenticated = false,
  userEmail,
}: {
  currentTier: SubscriptionTier;
  portalUrl?: string;
  upgradeStatus?: string;
  authenticated?: boolean;
  userEmail?: string;
}) {
  // Платёжный код (checkout) отключён на время beta — закомментирован, не удалён.
  // const { loading, startCheckout } = useCheckout();
  // const [annual, setAnnual] = useState(false);
  // const isPro = currentTier === "pro";

  const [email, setEmail] = useState(userEmail ?? "");
  const [waitlistStatus, setWaitlistStatus] = useState<
    "idle" | "loading" | "error"
  >("idle");

  async function handleWaitlist(e: React.FormEvent) {
    e.preventDefault();
    if (waitlistStatus === "loading") return;
    setWaitlistStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = (await res.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      if (!res.ok) throw new Error(json?.error?.message ?? "Waitlist failed");
      toast.success("You're on the list! We'll email you when Pro launches.");
      setWaitlistStatus("idle");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setWaitlistStatus("error");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Crown className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Pro is coming soon
        </h1>
        <p className="mt-2 text-muted-foreground">
          Premium features are on the way. All features are free during beta!
        </p>
      </div>

      <form
        onSubmit={handleWaitlist}
        className="mx-auto mt-8 flex w-full max-w-md flex-col gap-2 sm:flex-row"
      >
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-label="Email address"
          disabled={waitlistStatus === "loading"}
        />
        <Button type="submit" disabled={waitlistStatus === "loading"} className="shrink-0">
          {waitlistStatus === "loading" ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Bell className="mr-1.5 h-4 w-4" />
          )}
          Notify me when Pro launches
        </Button>
      </form>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        No spam — one email when paid plans open up.
      </p>

      {/*
      ============ Платёжный UI (закомментирован до запуска Pro) ============

      {upgradeStatus === "success" && (
        <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-800">
          {COPY.success}
        </div>
      )}

      <div className="mt-8 flex items-center justify-center gap-3">
        <span className={cn("text-sm", !annual ? "font-medium text-foreground" : "text-muted-foreground")}>
          Monthly
        </span>
        <Switch checked={annual} onCheckedChange={setAnnual} aria-label={COPY.annualLabel} />
        <span className={cn("text-sm", annual ? "font-medium text-foreground" : "text-muted-foreground")}>
          {COPY.annualLabel}
        </span>
        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600">
          <Sparkles className="mr-1 h-3 w-3" />
          {COPY.annualSave}
        </Badge>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <PlanCard
          plan={COPY.plans.free}
          annual={annual}
          isCurrent={!isPro && authenticated}
          onAction={() => {}}
          actionLoading={false}
          href={authenticated ? undefined : "/login"}
        />
        <PlanCard
          plan={COPY.plans.pro}
          annual={annual}
          featured
          isCurrent={isPro}
          onAction={() => {
            trackEvent("pro_upgrade", {
              source: "pricing_page",
              period: annual ? "yearly" : "monthly",
            });
            void startCheckout(annual ? "yearly" : "monthly");
          }}
          actionLoading={loading}
          portalUrl={portalUrl}
        />
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        {COPY.finePrint}
      </p>

      <section id="faq" className="mt-16 scroll-mt-16">
        <h2 className="text-center text-2xl font-semibold tracking-tight">
          {COPY.faqTitle}
        </h2>
        <Accordion type="single" collapsible className="mx-auto mt-8 max-w-xl">
          {COPY.faq.map((item) => (
            <AccordionItem key={item.q} value={item.q}>
              <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
              <AccordionContent>{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
      ============ конец платёжного UI ============
      */}
    </div>
  );
}