import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  ApiError,
  fail,
  ok,
  parseBody,
  requireUser,
} from "@/lib/api";
import { subscriptionSchema } from "@/lib/schemas";
import { getUserLimits } from "@/lib/billing/tier";

// POST /api/subscriptions — создать подписку
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const user = await requireUser(supabase);
    const input = await parseBody(request, subscriptionSchema);

    // Лимит тарифа: Free — до 3 подписок (удалённые не считаются)
    const { count } = await supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("deleted_at", null);
    const limits = await getUserLimits(supabase, user.id);
    if ((count ?? 0) >= limits.max_subscriptions) {
      throw new ApiError(
        402,
        "Достигнут лимит подписок бесплатного тарифа. Перейдите на Pro",
        "UPGRADE_REQUIRED"
      );
    }

    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .insert({ ...input, user_id: user.id })
      .select()
      .single();

    if (error) throw error;

    return ok(subscription, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}

// GET /api/subscriptions — свои подписки (+ связанные группы)
export async function GET() {
  try {
    const supabase = createClient();
    await requireUser(supabase);

    const { data: subscriptions, error } = await supabase
      .from("subscriptions")
      .select(
        "id, name, category, price, currency, billing_cycle, billing_day, created_at, updated_at, groups(id, name, creator_id)"
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return ok(subscriptions);
  } catch (error) {
    return fail(error);
  }
}
