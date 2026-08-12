import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Set up your profile — SubSplit",
  description:
    "Pick a username, add a phone number and payment details so friends can pay you back easily.",
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
      "id, display_name, email, username, avatar_url, phone_number, venmo_username, cash_tag, zelle_email, zelle_phone, onboarding_completed"
    )
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_completed) {
    // Кука-кэш для middleware: прошедшие онбординг юзеры (в т.ч. до куки) не зацикливаются
    cookies().set("onboarding_status", "complete", {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
    });
    redirect("/dashboard");
  }

  // Дефолтное имя из Google OAuth (full_name) или префикса email
  const oauthName =
    (typeof user.user_metadata?.full_name === "string" &&
      user.user_metadata.full_name) ||
    (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
    user.email?.split("@")[0] ||
    "";

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
            display_name: profile?.display_name ?? oauthName,
            username: profile?.username ?? null,
            avatar_url: profile?.avatar_url ?? null,
            phone_number: profile?.phone_number ?? null,
            venmo_username: profile?.venmo_username ?? null,
            cash_tag: profile?.cash_tag ?? null,
            zelle_email: profile?.zelle_email ?? null,
            zelle_phone: profile?.zelle_phone ?? null,
          }}
        />
      </main>
    </div>
  );
}
