import { withProRoute } from "@/lib/billing/tier";
import { ok } from "@/lib/api";
import { roundMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

// GET /api/usage — статистика пользователя (Pro-only, через withProRoute)
// Показывает, как работает HOC-гвард: free-пользователи получают 402.
export const GET = withProRoute(async (_request, _ctx, supabase, userId) => {
  const [{ count: subscriptionsCount }, { data: ownedGroups }, { data: memberships }] =
    await Promise.all([
      supabase
        .from("subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .is("deleted_at", null),
      supabase.from("groups").select("id").eq("creator_id", userId),
      supabase.from("group_members").select("group_id").eq("user_id", userId),
    ]);

  const groupIds = new Set<string>([
    ...(ownedGroups ?? []).map((g) => g.id),
    ...(memberships ?? []).map((m) => m.group_id),
  ]);

  const { data: payments } = await supabase
    .from("payments")
    .select("from_user_id, to_user_id, amount, currency, status")
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`);

  let pendingOwed = 0;
  let pendingExpected = 0;
  let paidTotal = 0;
  let currency = "USD";

  for (const p of payments ?? []) {
    currency = p.currency ?? currency;
    if (p.status === "paid") {
      if (p.from_user_id === userId) paidTotal += p.amount;
    } else {
      if (p.from_user_id === userId) pendingOwed += p.amount;
      if (p.to_user_id === userId) pendingExpected += p.amount;
    }
  }

  return ok({
    subscriptions_count: subscriptionsCount ?? 0,
    groups_count: groupIds.size,
    pending_owed: roundMoney(pendingOwed),
    pending_expected: roundMoney(pendingExpected),
    paid_total: roundMoney(paidTotal),
    currency,
  });
});
