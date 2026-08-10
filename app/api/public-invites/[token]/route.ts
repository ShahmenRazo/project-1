import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPublicInviteInfo } from "@/lib/public-invites";
import { notifyUser } from "@/lib/notifications";
import { recordReferral } from "@/lib/referrals";
import { getUserLimits } from "@/lib/billing/tier";
import { ApiError, fail, ok, requireUser } from "@/lib/api";
import { nextBillingDate, roundMoney, shareAmount } from "@/lib/utils";

/**
 * GET /api/public-invites/[token] — данные публичной ссылки (публичный).
 * POST /api/public-invites/[token] — присоединиться по ссылке (авторизация).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const info = await getPublicInviteInfo(params.token);
    if (!info) {
      throw new ApiError(404, "Link not found", "LINK_NOT_FOUND");
    }
    return ok({ invite: info });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = createClient();
    const user = await requireUser(supabase);

    const info = await getPublicInviteInfo(params.token);
    if (!info) {
      throw new ApiError(404, "Link not found", "LINK_NOT_FOUND");
    }
    if (!info.valid) {
      throw new ApiError(
        info.reason === "expired" ? 410 : 409,
        info.reason === "expired"
          ? "Link has expired"
          : "Link usage limit reached",
        info.reason === "expired" ? "LINK_EXPIRED" : "LINK_EXHAUSTED"
      );
    }

    const admin = createAdminClient();

    // Уже участник?
    const { data: existingMember } = await admin
      .from("group_members")
      .select("id")
      .eq("group_id", info.group_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (existingMember) {
      throw new ApiError(409, "You are already a member", "ALREADY_MEMBER");
    }

    // Лимит участников по плану создателя
    const { data: creatorRow } = await admin
      .from("users")
      .select("subscription_tier")
      .eq("id", info.creator_id)
      .maybeSingle();
    const limits = await getUserLimits(admin, info.creator_id);
    if (info.member_count + 1 > limits.max_group_members) {
      throw new ApiError(
        402,
        "Group is full. The creator needs to upgrade to Pro",
        "GROUP_FULL"
      );
    }

    // Свободная доля должна остаться (без неё join не имеет смысла)
    if (info.share_percent <= 0) {
      throw new ApiError(409, "No shares left in this group", "NO_SHARES_LEFT");
    }

    // --- Добавляем участника ---
    const { error: insertError } = await admin
      .from("group_members")
      .insert({
        group_id: info.group_id,
        user_id: user.id,
        share_percent: info.share_percent,
        payment_status: "pending",
      });
    if (insertError) throw insertError;

    // --- Долг перед владельцем подписки ---
    let amount = 0;
    const { data: subscription } = await admin
      .from("groups")
      .select("subscriptions(user_id, price, currency, billing_cycle, billing_day)")
      .eq("id", info.group_id)
      .maybeSingle();
    const sub = subscription?.subscriptions;

    if (sub && user.id !== sub.user_id) {
      amount = roundMoney(
        shareAmount(sub.price, info.share_percent, sub.billing_cycle)
      );
      const { error: payError } = await admin.from("payments").insert({
        group_id: info.group_id,
        from_user_id: user.id,
        to_user_id: sub.user_id,
        amount,
        currency: sub.currency,
        status: "pending",
        due_date: nextBillingDate(sub.billing_day),
      });
      if (payError) throw payError;
    }

    // --- Инкремент использования ссылки ---
    await admin
      .from("public_invites")
      .update({ uses_count: info.uses_count + 1 })
      .eq("token", params.token);

    // --- Реферальная запись: кто пригласил ---
    await recordReferral(user.id, info.creator_id);

    // --- Уведомление создателю ---
    await notifyUser(
      info.creator_id,
      "system",
      `${user.email} joined group "${info.group_name}"`,
      {
        title: "SubSplit: new member",
        body: `${user.email} joined via public link`,
        url: `/groups/${info.group_id}`,
      }
    );

    return ok(
      {
        group_id: info.group_id,
        share_percent: info.share_percent,
        amount,
        currency: info.currency,
      },
      { status: 201 }
    );
  } catch (error) {
    return fail(error);
  }
}
