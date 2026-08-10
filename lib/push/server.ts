import { createAdminClient } from "@/lib/supabase/admin";
import { sendFcmMessage } from "@/lib/push/fcm";

/**
 * Отправка push всем устройствам пользователя.
 * Недействительные токены удаляются из БД. Ошибки не роняют вызывающий код.
 */
export async function notifyUserPush(
  userId: string,
  title: string,
  body: string,
  url: string
): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("push_subscriptions")
      .select("token")
      .eq("user_id", userId);

    if (error) {
      console.error("[push] failed to fetch tokens:", error.message);
      return;
    }

    for (const sub of data ?? []) {
      const result = await sendFcmMessage(sub.token, { title, body, url });
      if (!result.ok) {
        if (result.tokenInvalid) {
          await admin.from("push_subscriptions").delete().eq("token", sub.token);
        } else {
          console.error("[push] send failed:", result.error);
        }
      }
    }
  } catch (error) {
    console.error("[push] notifyUserPush failed:", error);
  }
}
