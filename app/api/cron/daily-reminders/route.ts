import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyUser } from "@/lib/notifications";
import { formatMoney } from "@/lib/format";
import { roundMoney } from "@/lib/utils";

// GET /api/cron/daily-reminders — Vercel Cron (ежедневно 08:00 UTC)
// Защита: Authorization: Bearer CRON_SECRET
// Логика: находит просроченные/сегодняшние долги, по которым не слали
// напоминание >23 часов, шлёт notification + push каждому должнику.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const dayAgo = new Date(Date.now() - 23 * 3600 * 1000).toISOString();

  const { data: payments, error } = await admin
    .from("payments")
    .select(
      "id, from_user_id, amount, currency, due_date, groups(id, name, subscriptions(name))"
    )
    .eq("status", "pending")
    .lte("due_date", today)
    .or(`last_reminded_at.is.null,last_reminded_at.lt.${dayAgo}`);

  if (error) {
    console.error("[cron] failed to fetch payments:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Группировка долгов по должнику
  const byUser = new Map<
    string,
    {
      ids: string[];
      total: number;
      currency: string;
      groupId: string;
      groupName: string;
      subName: string;
    }
  >();

  for (const p of payments ?? []) {
    const group = p.groups as unknown as {
      id: string;
      name: string;
      subscriptions: { name: string } | null;
    } | null;

    const entry =
      byUser.get(p.from_user_id) ?? {
        ids: [],
        total: 0,
        currency: p.currency,
        groupId: group?.id ?? "",
        groupName: group?.name ?? "группе",
        subName: group?.subscriptions?.name ?? "подписке",
      };
    entry.ids.push(p.id);
    entry.total = roundMoney(entry.total + p.amount);
    if (group?.id) entry.groupId = group.id;
    if (group?.name) entry.groupName = group.name;
    if (group?.subscriptions?.name) entry.subName = group.subscriptions.name;
    byUser.set(p.from_user_id, entry);
  }

  const remindedIds: string[] = [];

  for (const [userId, entry] of byUser) {
    const message = `Напоминание: у вас долг ${formatMoney(
      entry.total,
      entry.currency
    )} в группе «${entry.groupName}» (${entry.subName})`;

    await notifyUser(userId, "reminder", message, {
      title: "SubSplit: напоминание о долге",
      body: message,
      url: entry.groupId ? `/groups/${entry.groupId}` : "/",
    });

    remindedIds.push(...entry.ids);
  }

  // Отметка: напоминание отправлено (чтобы не спамить ежедневно)
  if (remindedIds.length > 0) {
    const { error: updateError } = await admin
      .from("payments")
      .update({ last_reminded_at: new Date().toISOString() })
      .in("id", remindedIds);
    if (updateError) {
      console.error("[cron] failed to update last_reminded_at:", updateError.message);
    }
  }

  return NextResponse.json({
    ok: true,
    reminded_debtors: byUser.size,
    payments_processed: remindedIds.length,
  });
}
