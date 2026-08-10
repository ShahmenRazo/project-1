import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
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
import { resolveMemberUserIdsSoft } from "@/lib/members";
import { notifyUser } from "@/lib/notifications";
import { sendInviteEmail } from "@/lib/resend";
import { getUserLimits } from "@/lib/billing/tier";
import { formatMoney } from "@/lib/format";
import { nextBillingDate, roundMoney, shareAmount } from "@/lib/utils";

const INVITE_TTL_DAYS = 7;

function inviteLink(token: string): string {
  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  return `${origin}/invite/${token}`;
}

// GET /api/groups — мои группы с моей долей и суммами долгов
export async function GET() {
  try {
    const supabase = createClient();
    const user = await requireUser(supabase);

    const { data: memberships, error: membershipsError } = await supabase
      .from("group_members")
      .select(
        "group_id, share_percent, groups(id, name, creator_id, subscription_id, subscriptions(name))"
      )
      .eq("user_id", user.id)
      .order("group_id", { ascending: false });

    if (membershipsError) throw membershipsError;

    const groups = (memberships ?? []).filter((m) => m.groups);
    if (groups.length === 0) return ok({ groups: [] });

    const groupIds = groups.map((m) => m.group_id);
    const groupById = new Map(
      groups.map((m) => [m.group_id, m.groups as Record<string, unknown>])
    );

    const [{ data: members }, { data: payments }] = await Promise.all([
      supabase
        .from("group_members")
        .select("group_id, user_id")
        .in("group_id", groupIds),
      supabase
        .from("payments")
        .select("group_id, from_user_id, to_user_id, amount, currency")
        .in("group_id", groupIds)
        .eq("status", "pending"),
    ]);

    const memberCount = new Map<string, number>();
    for (const m of members ?? []) {
      memberCount.set(m.group_id, (memberCount.get(m.group_id) ?? 0) + 1);
    }

    const owedByMe = new Map<string, number>();
    const owedToMe = new Map<string, number>();
    const currencies = new Map<string, string>();
    for (const p of payments ?? []) {
      if (p.from_user_id === user.id) {
        owedByMe.set(p.group_id, (owedByMe.get(p.group_id) ?? 0) + p.amount);
        currencies.set(p.group_id, p.currency);
      } else if (p.to_user_id === user.id) {
        owedToMe.set(p.group_id, (owedToMe.get(p.group_id) ?? 0) + p.amount);
        currencies.set(p.group_id, p.currency);
      }
    }

    const result = groups.map((m) => {
      const g = m.groups as {
        id: string;
        name: string;
        creator_id: string;
        subscription_id: string;
        subscriptions: { name: string } | null;
      };
      return {
        id: g.id,
        name: g.name,
        creator_id: g.creator_id,
        subscription_id: g.subscription_id,
        subscription_name: g.subscriptions?.name ?? null,
        my_share_percent: m.share_percent,
        member_count: memberCount.get(g.id) ?? 0,
        owed_by_me: owedByMe.get(g.id) ?? 0,
        owed_to_me: owedToMe.get(g.id) ?? 0,
        currency: currencies.get(g.id) ?? "USD",
      };
    });

    return NextResponse.json({ data: { groups: result } });
  } catch (error) {
    return fail(error);
  }
}

// POST /api/groups — создать группу для деления подписки
// Тело: { name, subscription_id, members?: [{ user_id | email, share_percent }] }
// Незарегистрированные email → создаётся invite (таблица invites) + письмо Resend
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

    // --- 2. Резолвим членов: найденные + ненайденные (для invite) ---
    const { resolved, missing } = await resolveMemberUserIdsSoft(input.members);
    if (resolved.some((m) => m.user_id === user.id)) {
      throw new ApiError(
        400,
        "Creator is added as a member automatically",
        "CREATOR_IS_MEMBER"
      );
    }

    const allShares = [
      ...resolved.map((m) => m.share_percent),
      ...missing.map((m) => m.share_percent),
    ];
    const memberSum = roundMoney(
      allShares.reduce((sum, s) => sum + s, 0)
    );
    if (memberSum >= 100) {
      throw new ApiError(
        400,
        `Members' shares must be less than 100% (got ${memberSum}%)`,
        "SHARES_EXCEEDED"
      );
    }
    const creatorShare = roundMoney(100 - memberSum);

    // Лимит тарифа: Free — до 2 человек в группе (включая создателя).
    // Считаем только фактических участников; приглашённые добавятся при приёме
    // (тогда лимит проверяется повторно).
    const limits = await getUserLimits(supabase, user.id);
    const totalPeople = resolved.length + 1;
    if (totalPeople > limits.max_group_members) {
      throw new ApiError(
        402,
        `On the Free plan a group can have at most ${limits.max_group_members} people. Upgrade to Pro`,
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

    // --- 4. Добавляем создателя + найденных членов в group_members ---
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

    // --- 5. Создаём долги (payments): каждый найденный член -> владелец подписки ---
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
          title: "SubSplit: new debt",
          body: `You owe ${formatMoney(amount, subscription.currency)} for ${subscription.name}`,
          url: `/groups/${group.id}`,
        }
      );
    }

    // --- 6. Invite-флоу для незарегистрированных email ---
    const invited: { email: string; link: string }[] = [];
    for (const m of missing) {
      const expiresAt = new Date(
        Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000
      ).toISOString();

      let token: string;
      const { data: existing } = await supabase
        .from("invites")
        .select("id, token")
        .eq("group_id", group.id)
        .eq("email", m.email)
        .eq("status", "pending")
        .maybeSingle();

      if (existing) {
        // Повторное приглашение того же email — продлеваем срок и обновляем долю
        token = existing.token;
        const { error: updError } = await supabase
          .from("invites")
          .update({ share_percent: m.share_percent, expires_at: expiresAt })
          .eq("id", existing.id);
        if (updError) throw updError;
      } else {
        token = randomBytes(32).toString("hex");
        const { error: invError } = await supabase.from("invites").insert({
          group_id: group.id,
          email: m.email,
          token,
          share_percent: m.share_percent,
          expires_at: expiresAt,
        });
        if (invError) throw invError;
      }

      const link = inviteLink(token);
      const { sent } = await sendInviteEmail({
        to: m.email,
        groupName: group.name,
        subscriptionName: subscription.name,
        sharePercent: m.share_percent,
        inviteLink: link,
      });
      invited.push({ email: m.email, link: sent ? link : "" });
    }

    return ok(
      { group, creator_share: creatorShare, invited },
      { status: 201 }
    );
  } catch (error) {
    return fail(error);
  }
}
