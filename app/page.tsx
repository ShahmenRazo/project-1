import { redirect } from "next/navigation";
import Link from "next/link";
import { CreditCard, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { EnableNotificationsButton } from "@/components/push/enable-notifications";
import { Badge } from "@/components/ui/badge";
import type { BillingCycle, SubscriptionCategory } from "@/lib/database.types";
import type { SubscriptionTier } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export interface DashboardSubscription {
  id: string;
  name: string;
  category: SubscriptionCategory;
  price: number;
  currency: string;
  billing_cycle: BillingCycle;
  billing_day: number;
  created_at: string;
  group: { id: string; name: string; creator_id: string } | null;
}

export interface DashboardProfile {
  id: string;
  display_name: string | null;
  email: string;
  subscription_tier: SubscriptionTier;
}

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: subscriptions }, { data: profile }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select(
        "id, name, category, price, currency, billing_cycle, billing_day, created_at, groups(id, name, creator_id)"
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("users")
      .select("id, display_name, email, subscription_tier")
      .eq("id", user.id)
      .single(),
  ]);

  const subs: DashboardSubscription[] = (subscriptions ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category,
    price: s.price,
    currency: s.currency,
    billing_cycle: s.billing_cycle,
    billing_day: s.billing_day,
    created_at: s.created_at,
    group: s.groups ?? null,
  }));

  const me: DashboardProfile = {
    id: user.id,
    display_name: profile?.display_name ?? null,
    email: profile?.email ?? user.email ?? "",
    subscription_tier: profile?.subscription_tier ?? "free",
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2 font-semibold">
            <CreditCard className="h-5 w-5" />
            SubSplit
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant={me.subscription_tier === "pro" ? "default" : "secondary"}
            >
              {me.subscription_tier === "pro" ? "Pro" : "Free"}
            </Badge>
            <EnableNotificationsButton />
            <NotificationBell />
            <span className="hidden text-sm text-muted-foreground sm:block">
              {me.display_name ?? me.email}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <DashboardShell subscriptions={subs} profile={me} />
        <p className="mt-8 text-center text-sm text-muted-foreground">
          <Users className="mr-1 inline h-4 w-4" />
          Группы и балансы —{" "}
          <Link href="/groups" className="underline underline-offset-2">
            скоро
          </Link>
        </p>
      </main>
    </div>
  );
}
