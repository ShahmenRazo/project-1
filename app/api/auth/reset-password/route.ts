import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { fail, ok, parseBody } from "@/lib/api";

const resetSchema = z.object({
  email: z.string().email(),
});

/**
 * POST /api/auth/reset-password — запрос сброса пароля.
 * Отправляет письмо со ссылкой /reset-password?token_hash=...
 * Всегда отвечает успехом (202), чтобы не раскрывать существование email
 * (защита от перечисления пользователей). Ошибки пишутся только в лог.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await parseBody(request, resetSchema);

    const siteUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(body.email, {
      redirectTo: `${siteUrl}/reset-password`,
    });

    if (error) {
      // Письмо не ушло (например, SMTP не настроен) — логируем,
      // но клиенту отвечаем нейтрально
      console.error("[auth] resetPasswordForEmail failed:", error.message);
    }

    return ok({ sent: true }, { status: 202 });
  } catch (error) {
    return fail(error);
  }
}
