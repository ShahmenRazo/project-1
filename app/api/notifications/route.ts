import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { fail, ok, parseBody, requireUser } from "@/lib/api";

export const dynamic = "force-dynamic";

interface NotificationRow {
  id: string;
  type: string;
  message: string;
  image_url: string | null;
  created_at: string;
}

// GET /api/notifications — непрочитанные уведомления текущего пользователя
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const user = await requireUser(supabase);

    const limit = Math.min(
      Math.max(Number(request.nextUrl.searchParams.get("limit") ?? 10), 1),
      50
    );

    const { data, error } = await supabase
      .from("notifications")
      .select("id, type, message, image_url, created_at")
      .eq("user_id", user.id)
      .eq("read", false)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return ok({ notifications: (data ?? []) as NotificationRow[] });
  } catch (error) {
    return fail(error);
  }
}

const markReadSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(50),
});

// POST /api/notifications/read — пометить уведомления прочитанными
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const user = await requireUser(supabase);
    const body = await parseBody(request, markReadSchema);

    const { data, error } = await supabase
      .from("notifications")
      .update({ read: true, read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .in("id", body.ids)
      .select("id");

    if (error) throw error;
    if ((data?.length ?? 0) !== body.ids.length) {
      // Часть id чужие/несуществующие — не страшно, но отметим
    }

    return ok({ marked: data?.length ?? 0 });
  } catch (error) {
    return fail(error);
  }
}