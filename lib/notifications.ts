import { createAdminClient } from "@/lib/supabase/admin";
import { notifyUserPush } from "@/lib/push/server";
import type { NotificationType } from "@/lib/database.types";

/**
 * Создание уведомления ЛЮБОМУ пользователю (admin client обходит RLS).
 * Ошибка не роняет основную операцию — только логируется.
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  message: string,
  imageUrl?: string
): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("notifications")
      .insert({ user_id: userId, type, message, image_url: imageUrl ?? null });
    if (error) throw error;
  } catch (error) {
    console.error("[notifications] failed to create:", error);
  }
}

/**
 * Уведомление + push: сохраняет в БД и (опционально) шлёт FCM
 * на все устройства пользователя.
 */
export async function notifyUser(
  userId: string,
  type: NotificationType,
  message: string,
  push?: { title: string; body: string; url: string },
  imageUrl?: string
): Promise<void> {
  await createNotification(userId, type, message, imageUrl);
  if (push) {
    await notifyUserPush(userId, push.title, push.body, push.url);
  }
}
