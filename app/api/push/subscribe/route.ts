import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fail, ok, parseBody, requireUser } from "@/lib/api";
import { pushSubscriptionSchema } from "@/lib/schemas";

// POST /api/push/subscribe — сохранить FCM-токен устройства пользователя
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const user = await requireUser(supabase);
    const input = await parseBody(request, pushSubscriptionSchema);

    // upsert по токену: повторная подписка с того же устройства не плодит строки
    const { data, error } = await supabase
      .from("push_subscriptions")
      .upsert(
        { user_id: user.id, token: input.token, device: input.device },
        { onConflict: "token" }
      )
      .select()
      .single();

    if (error) throw error;

    return ok(data, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
