import { createAdminClient } from "@/lib/supabase/admin";

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Записать реферальную связь: userId пришёл по ссылке от referredBy.
 * Идемпотентно — повторные записи для одного user_id игнорируются.
 * Ошибка не должна ронять основную операцию (join/принятие invite).
 */
export async function recordReferral(
  userId: string,
  referredBy: string
): Promise<void> {
  if (!userId || !referredBy || userId === referredBy) return;
  try {
    const admin = createAdminClient();
    await admin.from("referrals").upsert(
      { user_id: userId, referred_by: referredBy },
      { onConflict: "user_id", ignoreDuplicates: true }
    );
  } catch (error) {
    console.error("[referrals] record failed:", error);
  }
}

/**
 * Начислить +1 месяц Pro (admin client). Продлевает текущий срок,
 * если он ещё не истёк, иначе — с текущего момента.
 */
export async function grantProMonth(userId: string): Promise<void> {
  const admin = createAdminClient();

  const { data } = await admin
    .from("users")
    .select("plan_expires_at")
    .eq("id", userId)
    .maybeSingle();

  const base = data?.plan_expires_at
    ? new Date(data.plan_expires_at).getTime()
    : 0;
  const extended = new Date(Math.max(base, Date.now()) + MONTH_MS).toISOString();

  const { error } = await admin
    .from("users")
    .update({ subscription_tier: "pro", plan_expires_at: extended })
    .eq("id", userId);

  if (error) {
    console.error("[referrals] grantProMonth failed:", error);
  }
}

/** Отметить реферала конвертированным (только первый раз) */
export async function markReferralConverted(userId: string): Promise<boolean> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("referrals")
    .update({ converted: true, converted_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("converted", false)
    .select("referred_by")
    .maybeSingle();

  if (error) {
    console.error("[referrals] markConverted failed:", error);
    return false;
  }
  return Boolean(data);
}
