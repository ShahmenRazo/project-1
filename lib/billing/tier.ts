import { NextRequest, NextResponse } from "next/server";
import { ApiError, fail, requireUser, type DbClient } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { LIMITS, type PlanLimits } from "@/lib/billing/plans";
import type { SubscriptionTier } from "@/lib/database.types";

/** Текущий тариф пользователя (fallback: free, если профиль не найден) */
export async function getUserTier(
  supabase: DbClient,
  userId: string
): Promise<SubscriptionTier> {
  const { data } = await supabase
    .from("users")
    .select("subscription_tier")
    .eq("id", userId)
    .maybeSingle();
  return data?.subscription_tier ?? "free";
}

/**
 * Pro отключён на время beta: все лимиты безграничны, Pro-гварды пропускают.
 * Код LemonSqueezy/webhooks/платежей при этом остаётся нетронутым.
 */
export const PRO_DISABLED = true;

/** Лимиты текущего плана пользователя */
export async function getUserLimits(
  supabase: DbClient,
  userId: string
): Promise<PlanLimits> {
  if (PRO_DISABLED) {
    return { max_subscriptions: Infinity, max_group_members: Infinity };
  }
  return LIMITS[await getUserTier(supabase, userId)];
}

/**
 * Гвард для Pro-функций: кидает 402 UPGRADE_REQUIRED,
 * если пользователь не на плане Pro.
 */
export async function requirePro(
  supabase: DbClient,
  userId: string
): Promise<void> {
  if (PRO_DISABLED) return;
  const tier = await getUserTier(supabase, userId);
  if (tier !== "pro") {
    throw new ApiError(
      402,
      "This feature is only available on the Pro plan",
      "UPGRADE_REQUIRED"
    );
  }
}

/**
 * HOC для Pro-only API-роутов: auth + проверка тарифа + единая обработка ошибок.
 *
 * export const GET = withProRoute(async (_req, _ctx, supabase, userId) => {
 *   return ok({ ... });
 * });
 */
export function withProRoute<Ctx extends { params?: Record<string, string> }>(
  handler: (
    request: NextRequest,
    ctx: Ctx,
    supabase: DbClient,
    userId: string
  ) => Promise<NextResponse> | NextResponse
) {
  return async (request: NextRequest, ctx: Ctx): Promise<NextResponse> => {
    try {
      const supabase = createClient();
      const user = await requireUser(supabase);
      await requirePro(supabase, user.id);
      return await handler(request, ctx, supabase, user.id);
    } catch (error) {
      return fail(error);
    }
  };
}
