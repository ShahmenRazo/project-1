import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ApiError,
  fail,
  ok,
  requireUser,
} from "@/lib/api";
import { fetchInviteByToken } from "@/lib/invites";
import { notifyUser } from "@/lib/notifications";
import { getUserLimits } from "@/lib/billing/tier";
import { formatMoney } from "@/lib/format";
import { nextBillingDate, roundMoney, shareAmount } from "@/lib/utils";

/**
 * GET /api/invites/[token] — проверка приглашения (публичная).
 * Возвращает данные для страницы /invite/[token]: группа, подписка,
 * доля и сумма долга. Доступна без авторизации — токен и есть секрет.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    if (!params.token || params.token.length < 32) {
      throw new ApiError(400, "Invalid invite token", "INVALID_TOKEN");
    }

    const invite = await fetchInviteByToken(params.token);
    if (!invite) {
      throw new ApiError(404, "Invite not found or already used", "INVITE_NOT_FOUND");
    }

    return ok({
      invite: {
        id: invite.id,
        group_name: invite.groups?.name ?? null,
        share_percent: invite.share_percent,
        expires_at: invite.expires_at,
        email: invite.email,
        subscription: invite.groups?.subscriptions
          ? {
              name: invite.groups.subscriptions.name,
              price: invite.groups.subscriptions.price,
              currency: invite.groups.subscriptions.currency,
              billing_cycle: invite.groups.subscriptions.billing_cycle,
            }
          : null,
        creator: invite.groups?.users
          ? {
              display_name: invite.groups.users.display_name,
              email: invite.groups.users.email,
            }
          : null,
      },
    });
  } catch (error) {
    return fail(error);
  }
}

/**
 * POST /api/invites/[token] — принять приглашение.
 * Требует авторизации: добавляет текущего пользователя в group_members,
 * создаёт долг (payment) и удаляет invite.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    if (!params.token || params.token.length < 32) {
      throw new ApiError(400, "Invalid invite token", "INVALID_TOKEN");
    }

    const supabase = createClient();
    const user = await requireUser(supabase);
    const admin = createAdminClient();

    const invite = await fetchInviteByToken(params.token);
    if (!invite) {
      throw new ApiError(404, "Invite not found or already used", "INVITE_NOT_FOUND");
    }
    if (invite.status !== "pending") {
      throw new ApiError(409, "Invite is no longer pending", "INVITE_USED");
    }
    if (new Date(invite.expires_at).getTime() < Date.now()) {
      throw new ApiError(410, "Invite has expired", "INVITE_EXPIRED");
    }

    // Приглашение адресовано конкретному email
    if (user.email?.toLowerCase() !== invite.email.toLowerCase()) {
      throw new ApiError(
        403,
        `Invite was issued for ${invite.email}. Sign in with that email to accept`,
        "EMAIL_MISMATCH"
      );
    }

    const group = invite.groups;
    const subscription = group?.subscriptions ?? null;
    if (!group || !subscription) {
      throw new ApiError(404, "Group or subscription not found", "NOT_FOUND");
    }

    // Уже участник?
    const { data: existingMember } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", group.id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (existingMember) {
      throw new ApiError(409, "You are already a member of this group", "ALREADY_MEMBER");
    }

    // Лимит тарифа участника-принимающего (владелец группы задаёт состав; лимит
    // по его тарифу уже учтён, здесь — лимит по тарифу нового участника)
    const { count } = await supabase
      .from("group_members")
      .select("id", { count: "exact", head: true })
      .eq("group_id", group.id);
    const limits = await getUserLimits(supabase, user.id);
    if ((count ?? 0) + 1 > limits.max_group_members) {
      throw new ApiError(
        402,
        `On the Free plan a group can have at most ${limits.max_group_members} people. Upgrade to Pro`,
        "UPGRADE_REQUIRED"
      );
    }

    // Контроль долей: 100% минус доли участников >= доля invite
    const { data: members } = await supabase
      .from("group_members")
      .select("share_percent")
      .eq("group_id", group.id);
    const currentSum = roundMoney(
      (members ?? []).reduce((sum, m) => sum + m.share_percent, 0)
    );
    if (roundMoney(currentSum + invite.share_percent) > 100) {
      throw new ApiError(
        409,
        "No shares left in this group",
        "SHARES_EXCEEDED"
      );
    }

    // --- 1. Добавляем участника (admin-клиент: только авторизованный
    // пользователь с этим email прошёл проверку выше) ---
    const { error: insertError } = await admin.from("group_members").insert({
      group_id: group.id,
      user_id: user.id,
      share_percent: invite.share_percent,
      payment_status: "pending",
    });
    if (insertError) throw insertError;

    // --- 2. Создаём долг участника перед владельцем подписки ---
    const amount = shareAmount(
      subscription.price,
      invite.share_percent,
      subscription.billing_cycle
    );

    if (user.id !== subscription.user_id) {
      const { error: payError } = await admin.from("payments").insert({
        group_id: group.id,
        from_user_id: user.id,
        to_user_id: subscription.user_id,
        amount,
        currency: subscription.currency,
        status: "pending",
        due_date: nextBillingDate(subscription.billing_day),
      });
      if (payError) throw payError;
    }

    // --- 3. Уведомляем создателя ---
    const { data: creatorProfile } = await admin
      .from("users")
      .select("display_name, email")
      .eq("id", group.creator_id)
      .maybeSingle();
    const creatorName =
      creatorProfile?.display_name ?? creatorProfile?.email.split("@")[0] ?? "User";

    await notifyUser(
      group.creator_id,
      "system",
      `${creatorName} joined group "${group.name}"`,
      {
        title: "SubSplit: new member",
        body: `${user.email} joined the group "${group.name}"`,
        url: `/groups/${group.id}`,
      }
    );

    // --- 4. Удаляем invite (одноразовый) ---
    const { error: deleteError } = await admin
      .from("invites")
      .delete()
      .eq("id", invite.id);
    if (deleteError) throw deleteError;

    return ok(
      {
        group_id: group.id,
        share_percent: invite.share_percent,
        amount:
          user.id === subscription.user_id
            ? 0
            : roundMoney(amount),
        currency: subscription.currency,
      },
      { status: 201 }
    );
  } catch (error) {
    return fail(error);
  }
}
