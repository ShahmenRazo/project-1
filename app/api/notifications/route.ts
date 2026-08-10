import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fail, ok, parseBody, requireUser } from "@/lib/api";
import { notificationsQuerySchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

// GET /api/notifications?limit=50&unread_only=true
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const user = await requireUser(supabase);

    const query = notificationsQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams)
    );

    let builder = supabase
      .from("notifications")
      .select("id, type, message, read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(query.limit);

    if (query.unread_only) {
      builder = builder.eq("read", false);
    }

    const { data: notifications, error } = await builder;
    if (error) throw error;

    const { count, error: countError } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false);
    if (countError) throw countError;

    return ok({ notifications, unread_count: count ?? 0 });
  } catch (error) {
    return fail(error);
  }
}
