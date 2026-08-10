import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fail, ok, parseBody, requireUser } from "@/lib/api";
import { pushUnsubscribeSchema } from "@/lib/schemas";

// DELETE /api/push/unsubscribe — удалить FCM-токен (пользователь отключил push)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const user = await requireUser(supabase);
    const input = await parseBody(request, pushUnsubscribeSchema);

    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("token", input.token)
      .eq("user_id", user.id);

    if (error) throw error;

    return ok({ removed: true });
  } catch (error) {
    return fail(error);
  }
}
