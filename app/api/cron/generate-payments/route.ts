import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { roundMoney, shareAmount } from "@/lib/utils";
import type { BillingCycle } from "@/lib/database.types";

// GET /api/cron/generate-payments — Vercel Cron (ежедневно 09:00 UTC)
// Защита: Authorization: Bearer CRON_SECRET
//
// Логика: для каждой активной группы (подписка без deleted_at), у которой
// день списания (billing_day) в текущем месяце уже наступил, но платёж за
// этот период ещё не создан — создаём payment для каждого члена группы
// (кроме владельца подписки): status='pending', amount = доля члена,
// due_date = дата списания текущего месяца.
//
// Идемпотентность: повторный запуск в тот же месяц ничего не создаёт
// (проверка существующего платежа по group_id + from_user_id + due_date),
// поэтому cron можно вызывать хоть каждый час.

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // --- 1. Группы + их подписки (без удалённых) ---
  const { data: groups, error: groupsError } = await admin
    .from("groups")
    .select("id, name, subscription_id");

  if (groupsError) {
    console.error("[cron:generate] failed to fetch groups:", groupsError.message);
    return NextResponse.json({ error: groupsError.message }, { status: 500 });
  }

  const groupIds = (groups ?? []).map((g) => g.id);
  if (groupIds.length === 0) {
    return NextResponse.json({ ok: true, groups_processed: 0, payments_created: 0 });
  }

  const subIds = [...new Set((groups ?? []).map((g) => g.subscription_id))];

  const [{ data: subscriptions }, { data: members }, { data: payments }] =
    await Promise.all([
      admin
        .from("subscriptions")
        .select("id, user_id, name, price, currency, billing_cycle, billing_day")
        .in("id", subIds)
        .is("deleted_at", null),
      admin.from("group_members").select("group_id, user_id, share_percent").in("group_id", groupIds),
      admin
        .from("payments")
        .select("group_id, from_user_id, due_date")
        .in("group_id", groupIds),
    ]);

  const subById = new Map((subscriptions ?? []).map((s) => [s.id, s]));
  const membersByGroup = new Map<string, typeof members>();
  for (const m of members ?? []) {
    const list = membersByGroup.get(m.group_id) ?? [];
    list.push(m);
    membersByGroup.set(m.group_id, list);
  }

  // Ключ: group_id|from_user_id|due_date — период уже оплачен/выставлен
  const existing = new Set(
    (payments ?? []).map((p) => `${p.group_id}|${p.from_user_id}|${p.due_date}`)
  );

  // --- 2. Период текущего месяца (UTC): день списания уже наступил? ---
  const now = new Date();
  const todayDay = now.getUTCDate();

  // --- 3. Создаём недостающие платежи ---
  const rows: {
    group_id: string;
    from_user_id: string;
    to_user_id: string;
    amount: number;
    currency: string;
    status: "pending";
    due_date: string;
  }[] = [];

  let groupsProcessed = 0;

  for (const group of groups ?? []) {
    const sub = subById.get(group.subscription_id);
    if (!sub) continue; // подписка удалена (soft-delete) — пропускаем группу

    if (sub.billing_day > todayDay) continue; // период ещё не наступил

    const periodDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), sub.billing_day)
    )
      .toISOString()
      .slice(0, 10);

    let createdForGroup = 0;

    for (const member of membersByGroup.get(group.id) ?? []) {
      // Владелец подписки сам себе не платит
      if (member.user_id === sub.user_id) continue;
      // Платёж за этот период уже существует (pending или paid) — не дублируем
      if (existing.has(`${group.id}|${member.user_id}|${periodDate}`)) continue;

      const amount = shareAmount(
        sub.price,
        member.share_percent,
        sub.billing_cycle as BillingCycle
      );

      rows.push({
        group_id: group.id,
        from_user_id: member.user_id,
        to_user_id: sub.user_id,
        amount: roundMoney(amount),
        currency: sub.currency,
        status: "pending",
        due_date: periodDate,
      });
      createdForGroup++;
    }

    if (createdForGroup > 0) groupsProcessed++;
  }

  let created = 0;
  if (rows.length > 0) {
    const { error: insertError } = await admin.from("payments").insert(rows);
    if (insertError) {
      console.error("[cron:generate] failed to insert payments:", insertError.message);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
    created = rows.length;
  }

  return NextResponse.json({
    ok: true,
    groups_processed: groupsProcessed,
    payments_created: created,
  });
}
