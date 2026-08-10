import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { GroupsPageContent } from "@/components/groups/groups-page-content";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
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

  return (
    <AppShell
      user={{
        display_name: profile?.display_name ?? null,
        email: profile?.email ?? user.email ?? "",
        subscription_tier: profile?.subscription_tier ?? "free",
      }}
    >
      <GroupsPageContent />
    </AppShell>
  );
}
