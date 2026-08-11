import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Set up your profile — SubSplit",
  description:
    "Pick a username, add a photo and payment details so friends can pay you back easily.",
};

export default async function OnboardingPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select(
      "id, display_name, email, username, avatar_url, venmo_username, cash_tag, zelle_email, onboarding_completed"
    )
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_completed) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-lg items-center px-4 font-semibold">
          SubSplit
        </div>
      </header>
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
        <OnboardingFlow
          initial={{
            display_name: profile?.display_name ?? null,
            username: profile?.username ?? null,
            avatar_url: profile?.avatar_url ?? null,
            venmo_username: profile?.venmo_username ?? null,
            cash_tag: profile?.cash_tag ?? null,
            zelle_email: profile?.zelle_email ?? null,
          }}
        />
      </main>
    </div>
  );
}
