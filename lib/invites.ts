import { createAdminClient } from "@/lib/supabase/admin";
import type { BillingCycle } from "@/lib/database.types";

export interface InviteWithDetails {
  id: string;
  email: string;
  token: string;
  share_percent: number;
  status: "pending" | "accepted" | "expired";
  expires_at: string;
  created_at: string;
  groups: {
    id: string;
    name: string;
    creator_id: string;
    users: { id: string; display_name: string | null; email: string } | null;
    subscriptions: {
      id: string;
      user_id: string;
      name: string;
      price: number;
      currency: string;
      billing_cycle: BillingCycle;
      billing_day: number;
    } | null;
  } | null;
}

/**
 * Чтение invite с вложенными группой/подпиской/создателем.
 * Использует admin client: users закрыта RLS, а страница приглашения публичная.
 */
export async function fetchInviteByToken(
  token: string
): Promise<InviteWithDetails | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("invites")
    .select(
      `id, email, token, share_percent, status, expires_at, created_at,
       groups(
         id, name, creator_id,
         users(id, display_name, email),
         subscriptions(id, user_id, name, price, currency, billing_cycle, billing_day)
       )`
    )
    .eq("token", token)
    .maybeSingle();

  if (error) {
    console.error("[invites] fetch error:", error.message);
    return null;
  }
  return data as InviteWithDetails | null;
}

export function isInviteValid(invite: InviteWithDetails): boolean {
  return (
    invite.status === "pending" &&
    new Date(invite.expires_at).getTime() > Date.now()
  );
}
