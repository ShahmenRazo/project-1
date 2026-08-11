import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { evaluateFlags } from "@/lib/feature-flags";

export const dynamic = "force-dynamic";

// GET /api/features — оценённые feature flags для текущего пользователя
export async function GET(_req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: { message: "Unauthorized", code: "UNAUTHORIZED" } },
      { status: 401 }
    );
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("users")
    .select("subscription_tier, is_beta")
    .eq("id", user.id)
    .maybeSingle();

  const { data: flags, error } = await admin
    .from("feature_flags")
    .select("name, enabled, rollout_percent, target");

  if (error) {
    return NextResponse.json(
      { error: { message: "Failed to load feature flags", code: "FEATURES_ERROR" } },
      { status: 500 }
    );
  }

  const features = evaluateFlags(flags ?? [], {
    id: user.id,
    subscription_tier: profile?.subscription_tier ?? null,
    is_beta: profile?.is_beta ?? false,
  });

  return NextResponse.json({ data: { features } });
}
