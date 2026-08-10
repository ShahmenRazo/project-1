import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  ApiError,
  fail,
  ok,
  requireUuid,
  requireUser,
} from "@/lib/api";
import { notifyUser } from "@/lib/notifications";
import { formatMoney } from "@/lib/format";

// POST /api/groups/[id]/remind — напомнить должникам группы
// Доступно только создателю группы. Создаёт 'reminder'-уведомления
// всем участникам с непогашенными долгами.
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireUuid(params.id, "group id");
    const supabase = createClient();
    const user = await requireUser(supabase);

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
        "Only the group creator can send reminders",
        "FORBIDDEN"
      );
    }

    const { data: payments, error: payError } = await supabase
      .from("payments")
      .select("from_user_id, amount, currency")
      .eq("group_id", group.id)
      .eq("status", "pending");

    if (payError) throw payError;

    // Суммируем долг каждого должника
    const debts = new Map<string, { amount: number; currency: string }>();
    for (const p of payments ?? []) {
      const current = debts.get(p.from_user_id);
      debts.set(p.from_user_id, {
        amount: (current?.amount ?? 0) + p.amount,
        currency: current?.currency ?? p.currency,
      });
    }

    let reminded = 0;
    for (const [userId, debt] of debts) {
      if (userId === user.id) continue;
      const message = `Reminder: you owe ${formatMoney(
        debt.amount,
        debt.currency
      )} in group "${group.name}"`;
      await notifyUser(userId, "reminder", message, {
        title: "SubSplit: debt reminder",
        body: message,
        url: `/groups/${group.id}`,
      });
      reminded++;
    }

    return ok({
      reminded,
      total_debtors: debts.size,
    });
  } catch (error) {
    return fail(error);
  }
}
