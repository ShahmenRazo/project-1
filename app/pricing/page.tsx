import Link from "next/link";
import { CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PricingPage } from "@/components/billing/pricing-page";
import { jsonLd, ORGANIZATION_SCHEMA } from "@/lib/seo";
import type { SubscriptionTier } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "SubSplit — Pro is coming soon",
  description:
    "Premium features are on the way. All SubSplit features are free during beta — split subscriptions with friends at no cost.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "SubSplit — Pro is coming soon",
    description:
      "Premium features are on the way. All SubSplit features are free during beta — split subscriptions with friends at no cost.",
    url: "/pricing",
    type: "website",
    siteName: "SubSplit",
    images: [
      {
        url: "/api/og?title=SubSplit%20Pricing",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SubSplit — Pro is coming soon",
    description:
      "Premium features are on the way. All SubSplit features are free during beta — split subscriptions with friends at no cost.",
    images: ["/api/og?title=SubSplit%20Pricing"],
  },
};

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
      {jsonLd(ORGANIZATION_SCHEMA)}

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
        userEmail={email}
      />
    </div>
  );
}
