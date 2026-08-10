import { createAdminClient } from "@/lib/supabase/admin";
import { roundMoney, shareAmount } from "@/lib/utils";
import type { BillingCycle } from "@/lib/database.types";

export interface PublicInviteInfo {
  token: string;
  group_id: string;
  group_name: string;
  creator_id: string;
  max_uses: number;
  uses_count: number;
  expires_at: string | null;
  /** Доля, которую получит новый участник (остаток до 100%) */
  share_percent: number;
  /** Месячная стоимость доли */
  share_monthly: number;
  currency: string;
  subscription: {
    name: string;
    price: number;
    currency: string;
    billing_cycle: BillingCycle;
  } | null;
  member_count: number;
  /** Мест больше нет (лимит плана создателя) */
  full: boolean;
  valid: boolean;
  reason?: "not_found" | "expired" | "uses_exhausted";
}

/**
 * Резолв публичной ссылки: проверка токена, срока действия, лимита
 * использований, подсчёт свободной доли. Используется страницей /join,
 * POST join и OG-картинкой. Публичный — токен и есть секрет.
 */
export async function getPublicInviteInfo(
  token: string
): Promise<PublicInviteInfo | null> {
  if (!token || token.length < 6 || token.length > 32) return null;

  const admin = createAdminClient();
  const { data: invite } = await admin
    .from("public_invites")
    .select("id, token, group_id, created_by, max_uses, uses_count, expires_at, created_at")
    .eq("token", token)
    .maybeSingle();

  if (!invite) return null;

  const { data: group } = await admin
    .from("groups")
    .select("id, name, creator_id, subscription_id")
    .eq("id", invite.group_id)
    .maybeSingle();

  if (!group) return null;

  const { data: sub } = group.subscription_id
    ? await admin
        .from("subscriptions")
        .select("name, price, currency, billing_cycle, billing_day")
        .eq("id", group.subscription_id)
        .is("deleted_at", null)
        .maybeSingle()
    : { data: null };

  const base: PublicInviteInfo = {
    token: invite.token,
    group_id: invite.group_id,
    group_name: group.name,
    creator_id: group.creator_id,
    max_uses: invite.max_uses,
    uses_count: invite.uses_count,
    expires_at: invite.expires_at,
    share_percent: 0,
    share_monthly: 0,
    currency: sub?.currency ?? "USD",
    subscription: sub
      ? {
          name: sub.name,
          price: sub.price,
          currency: sub.currency,
          billing_cycle: sub.billing_cycle,
        }
      : null,
    member_count: 0,
    full: false,
    valid: true,
  };

  // Срок действия
  if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
    return { ...base, valid: false, reason: "expired" };
  }
  // Лимит использований
  if (invite.max_uses > 0 && invite.uses_count >= invite.max_uses) {
    return { ...base, valid: false, reason: "uses_exhausted" };
  }

  // Участники и свободная доля
  const [{ count: memberCount }, { data: memberRows }] = await Promise.all([
    admin
      .from("group_members")
      .select("id", { count: "exact", head: true })
      .eq("group_id", group.id),
    admin
      .from("group_members")
      .select("share_percent")
      .eq("group_id", group.id),
  ]);

  const used = (memberRows ?? []).reduce(
    (sum, m) => sum + (m.share_percent ?? 0),
    0
  );
  const remaining = roundMoney(100 - used);

  base.member_count = memberCount ?? 0;
  base.share_percent = Math.max(0, remaining);
  if (sub) {
    base.currency = sub.currency;
    base.share_monthly = roundMoney(
      shareAmount(sub.price, Math.max(0, remaining), sub.billing_cycle)
    );
  }

  return base;
}
