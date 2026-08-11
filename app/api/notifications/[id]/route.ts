import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ApiError, fail, ok, requireUser } from "@/lib/api";

export const dynamic = "force-dynamic";

// PATCH /api/notifications/[id] — пометить уведомление прочитанным.
// Только для получателя уведомления (RLS + проверка user_id).
export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const user = await requireUser(supabase);

    if (!params.id) {
      throw new ApiError(400, "Notification id is required", "BAD_REQUEST");
    }

    const { data: notification, error } = await supabase
      .from("notifications")
      .update({ read: true, read_at: new Date().toISOString() })
      .eq("id", params.id)
      .eq("user_id", user.id)
      .select("id, type, message, read, read_at, created_at")
      .single();

    if (error || !notification) {
      if (error?.code === "PGRST116") {
        throw new ApiError(404, "Notification not found", "NOT_FOUND");
      }
      throw error;
    }

    return ok({ notification });
  } catch (error) {
    return fail(error);
  }
}
