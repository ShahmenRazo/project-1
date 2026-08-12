import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET /api/auth/onboarding-complete — ставит куку-кэш onboarding_status=complete
// и редиректит на /dashboard. Используется /onboarding для юзеров, уже
// прошедших онбординг (например, легаси-пользователи без куки), чтобы
// middleware не зацикливал их на /onboarding.
export async function GET() {
  const supabase = createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://kitstartai.com";
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", appUrl));
  }

  const response = NextResponse.redirect(
    new URL("/dashboard", appUrl),
    307
  );
  response.cookies.set("onboarding_status", "complete", {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
