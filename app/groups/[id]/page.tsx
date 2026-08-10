import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { GroupView } from "@/components/groups/group-view";
import type {
  GroupViewMember,
  GroupViewPayment,
} from "@/components/groups/group-view";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function GroupPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: group } = await supabase
    .from("groups")
    .select("id, name, creator_id, subscription_id")
    .eq("id", params.id)
    .maybeSingle();

  if (!group) notFound();

  const isCreator = group.creator_id === user.id;
  if (!isCreator) {
    const { data: membership } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", group.id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!membership) notFound();
  }

  const [{ data: memberRows }, { data: subscription }, { data: paymentRows }] =
    await Promise.all([
      supabase
        .from("group_members")
        .select("user_id, share_percent, payment_status")
        .eq("group_id", group.id),
      supabase
        .from("subscriptions")
        .select("name, price, currency, billing_cycle, billing_day")
        .eq("id", group.subscription_id)
        .maybeSingle(),
      supabase
        .from("payments")
        .select("id, from_user_id, to_user_id, amount, currency, due_date")
        .eq("group_id", group.id)
        .eq("status", "pending"),
    ]);

  // Имена участников: таблица users закрыта RLS — читаем через admin client
  const admin = createAdminClient();
  const { data: profiles } = await admin
    .from("users")
    .select("id, display_name, email, avatar_url")
    .in("id", (memberRows ?? []).map((m) => m.user_id));

  const profileById = new Map(
    (profiles ?? []).map((p) => [p.id, p])
  );

  const members: GroupViewMember[] = (memberRows ?? []).map((m) => {
    const profile = profileById.get(m.user_id);
    const name =
      profile?.display_name ??
      profile?.email.split("@")[0] ??
      "Пользователь";
    return {
      user_id: m.user_id,
      name,
      avatar_url: profile?.avatar_url ?? null,
      share_percent: m.share_percent,
      payment_status: m.payment_status,
      is_creator: m.user_id === group.creator_id,
    };
  });

  const payments: GroupViewPayment[] = (paymentRows ?? []).map((p) => ({
    id: p.id,
    from_user_id: p.from_user_id,
    to_user_id: p.to_user_id,
    amount: p.amount,
    currency: p.currency,
    due_date: p.due_date,
  }));

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
          <a href="/" className="text-sm font-semibold hover:underline">
            ← Дашборд
          </a>
          <span className="text-sm text-muted-foreground">
            {subscription
              ? ` · ${subscription.name} · ${formatMoney(subscription.price, subscription.currency)}`
              : ""}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <GroupView
          groupId={group.id}
          groupName={group.name}
          isCreator={isCreator}
          subscription={
            subscription
              ? {
                  name: subscription.name,
                  price: subscription.price,
                  currency: subscription.currency,
                  billing_cycle: subscription.billing_cycle,
                  billing_day: subscription.billing_day,
                }
              : null
          }
          members={members}
          payments={payments}
        />
      </main>
    </div>
  );
}
