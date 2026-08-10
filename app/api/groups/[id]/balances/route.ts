import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ApiError, fail, ok, requireUuid, requireUser } from "@/lib/api";
import { settleDebts } from "@/lib/balances";
import { createAdminClient } from "@/lib/supabase/admin";
import { roundMoney } from "@/lib/utils";

// GET /api/groups/[id]/balances — кто кому сколько должен
// (с оптимизацией: минимальное число переводов по нетто-балансам)
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireUuid(params.id, "group id");
    const supabase = createClient();
    const user = await requireUser(supabase);

    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id, name, creator_id, subscription_id")
      .eq("id", params.id)
      .maybeSingle();

    if (groupError) throw groupError;
    if (!group) throw new ApiError(404, "Group not found", "NOT_FOUND");

    // RLS: члены/создатель группы — единственные, кто может её прочитать.
    // Проверим явно, чтобы незнакомцу отдать 403, а не пустые данные.
    if (group.creator_id !== user.id) {
      const { data: membership } = await supabase
        .from("group_members")
        .select("user_id")
        .eq("group_id", group.id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!membership) {
        throw new ApiError(403, "You are not a member of this group", "FORBIDDEN");
      }
    }

    const [{ data: members }, { data: payments }, { data: subscription }] =
      await Promise.all([
        supabase
          .from("group_members")
          .select("user_id, share_percent, payment_status")
          .eq("group_id", group.id),
        supabase
          .from("payments")
          .select("id, from_user_id, to_user_id, amount, currency, status, due_date")
          .eq("group_id", group.id),
        supabase
          .from("subscriptions")
          .select("name, price, currency")
          .eq("id", group.subscription_id)
          .single(),
      ]);

    if (!members || !payments) {
      throw new ApiError(404, "Group data not found", "NOT_FOUND");
    }

    // --- Имена участников (users закрыта RLS, читаем через admin) ---
    const admin = createAdminClient();
    const { data: profiles } = await admin
      .from("users")
      .select("id, display_name, email")
      .in(
        "id",
        members.map((m) => m.user_id)
      );
    const nameById = new Map(
      (profiles ?? []).map((p) => [
        p.id,
        p.display_name ?? p.email.split("@")[0],
      ])
    );

    // --- Статистика по каждому участнику ---
    const memberStats = members.map((m) => {
      const owes = roundMoney(
        payments
          .filter((p) => p.from_user_id === m.user_id && p.status === "pending")
          .reduce((sum, p) => sum + p.amount, 0)
      );
      const isOwed = roundMoney(
        payments
          .filter((p) => p.to_user_id === m.user_id && p.status === "pending")
          .reduce((sum, p) => sum + p.amount, 0)
      );
      const paid = roundMoney(
        payments
          .filter((p) => p.from_user_id === m.user_id && p.status === "paid")
          .reduce((sum, p) => sum + p.amount, 0)
      );

      return {
        user_id: m.user_id,
        name: nameById.get(m.user_id) ?? "Unknown",
        share_percent: m.share_percent,
        owes,
        is_owed: isOwed,
        paid,
        net: roundMoney(isOwed - owes),
      };
    });

    // --- Минимальное число переводов ---
    const pending = payments.filter((p) => p.status === "pending");
    const settlements = settleDebts(pending);

    return ok({
      group: { id: group.id, name: group.name },
      subscription: subscription ?? null,
      members: memberStats,
      settlements,
    });
  } catch (error) {
    return fail(error);
  }
}
