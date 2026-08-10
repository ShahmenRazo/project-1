import Link from "next/link";
import { CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PricingPage } from "@/components/billing/pricing-page";
import type { SubscriptionTier } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function PricingPageRoute({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let tier: SubscriptionTier = "free";
  let email: string | undefined;
  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("subscription_tier, email")
      .eq("id", user.id)
      .single();
    tier = profile?.subscription_tier ?? "free";
    email = profile?.email ?? user.email ?? undefined;
  }

  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const portalUrl =
    storeId && email
      ? `https://${storeId}.lemonsqueezy.com/billing?email=${encodeURIComponent(email)}`
      : undefined;

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <CreditCard className="h-5 w-5" />
            SubSplit
          </Link>
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:underline"
          >
            Sign In
          </Link>
        </div>
      </header>

      <PricingPage
        currentTier={tier}
        portalUrl={portalUrl}
        upgradeStatus={searchParams.status}
        authenticated={!!user}
      />
    </div>
  );
}
