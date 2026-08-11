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
    .select("id, display_name, email, username, subscription_tier")
    .eq("id", user.id)
    .single();

  return (
    <AppShell
      user={{
        display_name: profile?.display_name ?? null,
        email: profile?.email ?? user.email ?? "",
        subscription_tier: profile?.subscription_tier ?? "free",
      }}
    >
      <ProfileContent
        user={{
          display_name: profile?.display_name ?? null,
          email: profile?.email ?? user.email ?? "",
          username: profile?.username ?? null,
          subscription_tier: profile?.subscription_tier ?? "free",
        }}
      />
    </AppShell>
  );
}
