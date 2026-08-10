import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  ApiError,
  fail,
  ok,
  requireUuid,
  requireUser,
} from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyUser } from "@/lib/notifications";

// PUT /api/payments/[id] — отметить долг оплаченным
// Участвовать могут только должник (from_user_id) или получатель (to_user_id).
// Идемпотентно: повторный вызов возвращает тот же payment без ошибки.
export async function PUT(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireUuid(params.id, "payment id");
    const supabase = createClient();
    const user = await requireUser(supabase);

    const { data: payment, error: findError } = await supabase
      .from("payments")
      .select("id, group_id, from_user_id, to_user_id, amount, currency, status, due_date")
      .eq("id", params.id)
      .maybeSingle();

    if (findError) throw findError;
    if (!payment) throw new ApiError(404, "Payment not found", "NOT_FOUND");

    // Проверка участия (RLS тоже ограничит, но для честного 403 — явно)
    const isInvolved =
      payment.from_user_id === user.id || payment.to_user_id === user.id;
    if (!isInvolved) {
      throw new ApiError(
        403,
        "You are not involved in this payment",
        "FORBIDDEN"
      );
    }

    // Идемпотентность: уже оплачен — отдаём как есть
    if (payment.status === "paid") {
      return ok(payment);
    }

    const { data: updated, error: updateError } = await supabase
      .from("payments")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", payment.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // --- Уведомляем вторую сторону (admin client обходит RLS) ---
    const counterpartId =
      payment.from_user_id === user.id
        ? payment.to_user_id
        : payment.from_user_id;

    const admin = createAdminClient();
    const { data: counterpart } = await admin
      .from("users")
      .select("display_name, email")
      .eq("id", counterpartId)
      .single();

    const name =
      counterpart?.display_name ??
      counterpart?.email.split("@")[0] ??
      "User";

    const message = `${name} подтвердил(а) оплату ${payment.amount} ${payment.currency}`;
    await notifyUser(counterpartId, "payment_paid", message, {
      title: "SubSplit: долг оплачен",
      body: message,
      url: payment.group_id ? `/groups/${payment.group_id}` : "/",
    });

    return ok(updated);
  } catch (error) {
    return fail(error);
  }
}
