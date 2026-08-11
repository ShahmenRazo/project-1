import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ApiError, fail, ok, parseBody, requireUser } from "@/lib/api";

// POST /api/payments — трекинг попытки оплаты через deep link
// (Venmo / Cash App / Zelle). Статус 'initiated' НЕ влияет на долги —
// настоящая оплата подтверждается отдельно (PUT /api/payments/[id]).
const schema = z.object({
  group_id: z.string().uuid(),
  to_user_id: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  method: z.enum(["venmo", "cash_app", "zelle"]),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const user = await requireUser(supabase);
    const body = await parseBody(req, schema);

    if (body.to_user_id === user.id) {
      throw new ApiError(400, "You cannot pay yourself", "BAD_REQUEST");
    }

    // Участник группы?
    const { data: membership } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", body.group_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!membership) {
      throw new ApiError(403, "You are not a member of this group", "FORBIDDEN");
    }

    // Рядом с долгом всегда создаются pending-строки (админ-клиент, обход RLS);
    // initiated-трекинг пишем тем же путём, чтобы дальнейшие выборки
    // (admin и user-клиент) остались консистентными.
    const admin = createAdminClient();
    const { data: inserted, error } = await admin
      .from("payments")
      .insert({
        group_id: body.group_id,
        from_user_id: user.id,
        to_user_id: body.to_user_id,
        amount: Math.round(body.amount * 100) / 100,
        currency: body.currency.toUpperCase(),
        status: "initiated",
        method: body.method,
        due_date: new Date().toISOString().slice(0, 10),
      })
      .select()
      .single();

    if (error) throw error;

    return ok({ payment: inserted }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}