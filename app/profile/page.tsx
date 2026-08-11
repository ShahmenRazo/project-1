import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { ProfileContent } from "@/components/profile/profile-content";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select(
      "id, display_name, email, username, avatar_url, phone_number, venmo_username, cash_tag, zelle_email, subscription_tier"
    )
    .eq("id", user.id)
    .single();

  return (
    <AppShell
      user={{
        display_name: profile?.display_name ?? null,
        email: profile?.email ?? user.email ?? "",
        avatar_url: profile?.avatar_url ?? null,
        subscription_tier: profile?.subscription_tier ?? "free",
      }}
    >
      <ProfileContent
        user={{
          display_name: profile?.display_name ?? null,
          email: profile?.email ?? user.email ?? "",
          username: profile?.username ?? null,
          avatar_url: profile?.avatar_url ?? null,
          phone_number: profile?.phone_number ?? null,
          venmo_username: profile?.venmo_username ?? null,
          cash_tag: profile?.cash_tag ?? null,
          zelle_email: profile?.zelle_email ?? null,
          subscription_tier: profile?.subscription_tier ?? "free",
        }}
      />
    </AppShell>
  );
}
