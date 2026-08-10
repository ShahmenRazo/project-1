import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  ApiError,
  fail,
  isPgError,
  ok,
  parseBody,
  requireUser,
} from "@/lib/api";
import { createGroupSchema } from "@/lib/schemas";
import { resolveMemberUserIds } from "@/lib/members";
import { notifyUser } from "@/lib/notifications";
import { getUserLimits } from "@/lib/billing/tier";
import { formatMoney } from "@/lib/format";
import { nextBillingDate, roundMoney, shareAmount } from "@/lib/utils";

// POST /api/groups — создать группу для деления подписки
// Тело: { name, subscription_id, members?: [{ user_id | email, share_percent }] }
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const user = await requireUser(supabase);
    const input = await parseBody(request, createGroupSchema);

    // --- 1. Подписка должна существовать и принадлежать пользователю ---
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("id, user_id, name, price, currency, billing_cycle, billing_day")
      .eq("id", input.subscription_id)
      .is("deleted_at", null)
      .single();

    if (subError || !subscription) {
      throw new ApiError(404, "Subscription not found", "NOT_FOUND");
    }
    if (subscription.user_id !== user.id) {
      throw new ApiError(
        403,
        "You do not own this subscription",
        "FORBIDDEN"
      );
    }

    // --- 2. Резолвим членов и проверяем доли ---
    const resolved = await resolveMemberUserIds(input.members);
    if (resolved.some((m) => m.user_id === user.id)) {
      throw new ApiError(
        400,
        "Creator is added as a member automatically",
        "CREATOR_IS_MEMBER"
      );
    }

    const memberSum = roundMoney(
      resolved.reduce((sum, m) => sum + m.share_percent, 0)
    );
    if (memberSum >= 100) {
      throw new ApiError(
        400,
        `Members' shares must be less than 100% (got ${memberSum}%)`,
        "SHARES_EXCEEDED"
      );
    }
    const creatorShare = roundMoney(100 - memberSum);

    // Лимит тарифа: Free — до 2 человек в группе (включая создателя)
    const limits = await getUserLimits(supabase, user.id);
    const totalPeople = resolved.length + 1;
    if (totalPeople > limits.max_group_members) {
      throw new ApiError(
        402,
        `На тарифе Free в группе может быть максимум ${limits.max_group_members} человека. Перейдите на Pro`,
        "UPGRADE_REQUIRED"
      );
    }

    // --- 3. Создаём группу (RLS: creator_id = auth.uid()) ---
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .insert({
        name: input.name,
        creator_id: user.id,
        subscription_id: input.subscription_id,
      })
      .select()
      .single();

    if (groupError) {
      if (isPgError(groupError, "23505")) {
        throw new ApiError(
          409,
          "Group already exists for this subscription",
          "GROUP_EXISTS"
        );
      }
      throw groupError;
    }

    // --- 4. Добавляем создателя + членов в group_members ---
    const memberRows = [
      { user_id: user.id, share_percent: creatorShare },
      ...resolved,
    ].map((m) => ({
      group_id: group.id,
      user_id: m.user_id,
      share_percent: m.share_percent,
      payment_status: "pending" as const,
    }));

    const { error: membersError } = await supabase
      .from("group_members")
      .insert(memberRows);

    if (membersError) throw membersError;

    // --- 5. Создаём долги (payments): каждый член -> владелец подписки ---
    const dueDate = nextBillingDate(subscription.billing_day);
    for (const member of resolved) {
      if (member.user_id === subscription.user_id) continue;

      const amount = shareAmount(
        subscription.price,
        member.share_percent,
        subscription.billing_cycle
      );

      const { error: payError } = await supabase.from("payments").insert({
        group_id: group.id,
        from_user_id: member.user_id,
        to_user_id: subscription.user_id,
        amount,
        currency: subscription.currency,
        status: "pending",
        due_date: dueDate,
      });
      if (payError) throw payError;

      await notifyUser(
        member.user_id,
        "group_invite",
        `You were added to group "${group.name}" for ${subscription.name}`,
        {
          title: "SubSplit: новый долг",
          body: `Вы должны ${formatMoney(amount, subscription.currency)} за ${subscription.name}`,
          url: `/groups/${group.id}`,
        }
      );
    }

    return ok({ group, creator_share: creatorShare }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
