import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import type { DashboardProfile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("id, display_name, email, subscription_tier")
    .eq("id", user.id)
    .single();

  const me: DashboardProfile = {
    id: user.id,
    display_name: profile?.display_name ?? null,
    email: profile?.email ?? user.email ?? "",
    subscription_tier: profile?.subscription_tier ?? "free",
  };

  return (
    <AppShell
      user={{
        display_name: me.display_name,
        email: me.email,
        subscription_tier: me.subscription_tier,
      }}
    >
      <DashboardContent profile={me} />
    </AppShell>
  );
}
