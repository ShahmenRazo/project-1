import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Heartbeat: обновляет last_active пользователя.
 * Вызывается клиентом (AppShell) при открытии приложения и каждые 5 минут.
 */
export async function POST(_req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: { message: "Unauthorized", code: "UNAUTHORIZED" } },
      { status: 401 }
    );
  }

  // RLS: users_update_own разрешает обновлять только свою строку
  const { error } = await supabase
    .from("users")
    .update({ last_active: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    // Молча игнорируем — heartbeat не критичен
    return NextResponse.json({ ok: false });
  }

  return NextResponse.json({ ok: true });
}
