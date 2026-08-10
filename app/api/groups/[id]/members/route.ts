import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  ApiError,
  fail,
  ok,
  parseBody,
  requireUuid,
  requireUser,
} from "@/lib/api";
import { addMemberSchema } from "@/lib/schemas";
import { resolveMemberUserIds } from "@/lib/members";
import { notifyUser } from "@/lib/notifications";
import { getUserLimits } from "@/lib/billing/tier";
import { formatMoney } from "@/lib/format";
import { nextBillingDate, roundMoney, shareAmount } from "@/lib/utils";

// POST /api/groups/[id]/members — добавить члена группы
// Тело: { user_id | email, share_percent }
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireUuid(params.id, "group id");
    const supabase = createClient();
    const user = await requireUser(supabase);
    const input = await parseBody(request, addMemberSchema);

    // --- 1. Группа существует + пользователь — её создатель ---
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id, name, creator_id, subscription_id")
      .eq("id", params.id)
      .maybeSingle();

    if (groupError) throw groupError;
    if (!group) throw new ApiError(404, "Group not found", "NOT_FOUND");
    if (group.creator_id !== user.id) {
      throw new ApiError(
        403,
        "Only the group creator can add members",
        "FORBIDDEN"
      );
    }

    // --- 2. Резолвим нового члена ---
    const [member] = await resolveMemberUserIds([input]);
    if (member.user_id === user.id) {
      throw new ApiError(
        400,
        "Creator is already a member",
        "ALREADY_MEMBER"
      );
    }

    const { data: existing } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", group.id)
      .eq("user_id", member.user_id)
      .maybeSingle();
    if (existing) {
      throw new ApiError(409, "User is already a member", "ALREADY_MEMBER");
    }

    // --- 3. Подписка группы (для расчёта суммы долга) ---
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("user_id, name, price, currency, billing_cycle, billing_day")
      .eq("id", group.subscription_id)
      .is("deleted_at", null)
      .single();

    if (subError || !subscription) {
      throw new ApiError(404, "Subscription not found", "NOT_FOUND");
    }

    // --- 4. Контроль долей: сумма не должна превысить 100% ---
    const { data: currentMembers } = await supabase
      .from("group_members")
      .select("id, user_id, share_percent")
      .eq("group_id", group.id);

    const currentSum = roundMoney(
      (currentMembers ?? []).reduce((sum, m) => sum + m.share_percent, 0)
    );
    const newSum = roundMoney(currentSum + member.share_percent);
    if (newSum > 100) {
      throw new ApiError(
        400,
        `Total shares would exceed 100% (${newSum}%)`,
        "SHARES_EXCEEDED"
      );
    }

    // Лимит тарифа: Free — до 2 человек в группе (включая создателя)
    const limits = await getUserLimits(supabase, user.id);
    if ((currentMembers?.length ?? 0) + 1 > limits.max_group_members) {
      throw new ApiError(
        402,
        `На тарифе Free в группе может быть максимум ${limits.max_group_members} человека. Перейдите на Pro`,
        "UPGRADE_REQUIRED"
      );
    }

    // Доля создателя пересчитывается: 100% - доля всех остальных
    const creatorMember = (currentMembers ?? []).find(
      (m) => m.user_id === user.id
    );
    const creatorShare = roundMoney(100 - newSum);
    if (creatorMember && creatorMember.share_percent !== creatorShare) {
      const { error: updateError } = await supabase
        .from("group_members")
        .update({ share_percent: creatorShare })
        .eq("id", creatorMember.id);
      if (updateError) throw updateError;
    }

    // --- 5. Добавляем члена + создаём долг ---
    const { data: newMember, error: insertError } = await supabase
      .from("group_members")
      .insert({
        group_id: group.id,
        user_id: member.user_id,
        share_percent: member.share_percent,
        payment_status: "pending",
      })
      .select()
      .single();
    if (insertError) throw insertError;

    if (member.user_id !== subscription.user_id) {
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
        due_date: nextBillingDate(subscription.billing_day),
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

    return ok(newMember, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
