import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fail, ok, requireUser } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * GET /api/referrals/stats — статистика рефералов текущего пользователя:
 * сколько пригласил и сколько из них оформили Pro.
 */
export async function GET() {
  try {
    const supabase = createClient();
    const user = await requireUser(supabase);

    const admin = createAdminClient();
    const [{ count: invited }, { count: converted }] = await Promise.all([
      admin
        .from("referrals")
        .select("id", { count: "exact", head: true })
        .eq("referred_by", user.id),
      admin
        .from("referrals")
        .select("id", { count: "exact", head: true })
        .eq("referred_by", user.id)
        .eq("converted", true),
    ]);

    return ok({
      invited: invited ?? 0,
      converted: converted ?? 0,
      bonus_per_conversion: "1 month Pro",
    });
  } catch (error) {
    return fail(error);
  }
}
