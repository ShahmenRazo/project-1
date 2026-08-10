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
import { createNotification } from "@/lib/notifications";

// POST /api/payments/[id]/mark-paid — отметить долг оплаченным
// Идемпотентно: повторный вызов возвращает тот же payment без ошибки
export async function POST(
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

    // Участвовать могут только должник или получатель (RLS тоже ограничит)
    const isInvolved =
      payment.from_user_id === user.id || payment.to_user_id === user.id;
    if (!isInvolved) {
      throw new ApiError(
        403,
        "You are not involved in this payment",
        "FORBIDDEN"
      );
    }

    // Идемпотентность
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

    await createNotification(
      counterpartId,
      "payment_paid",
      `${name} marked ${payment.amount} ${payment.currency} as paid`
    );

    return ok(updated);
  } catch (error) {
    return fail(error);
  }
}
