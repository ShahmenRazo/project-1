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
    .select(
      "id, display_name, email, username, avatar_url, venmo_username, cash_tag, zelle_email, onboarding_completed, subscription_tier"
    )
    .eq("id", user.id)
    .single();

  // Прогрессивный онбординг: незавершённый профиль -> /onboarding
  if (!profile?.onboarding_completed) redirect("/onboarding");

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
        avatar_url: profile?.avatar_url ?? null,
        subscription_tier: me.subscription_tier,
      }}
    >
      <DashboardContent
        profile={me}
        emailConfirmed={!!user.email_confirmed_at}
        handles={{
          venmo_username: profile?.venmo_username ?? null,
          cash_tag: profile?.cash_tag ?? null,
          zelle_email: profile?.zelle_email ?? null,
        }}
      />
    </AppShell>
  );
}
