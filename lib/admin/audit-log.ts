import { createAdminClient } from "@/lib/supabase/admin";
import type { NextRequest } from "next/server";

export type AdminAction =
  | "ban_user"
  | "unban_user"
  | "delete_user"
  | "impersonate"
  | "refund"
  | "toggle_pro"
  | "flag_create"
  | "flag_update"
  | "flag_delete";

/**
 * Запись действия админа в admin_logs (audit log).
 * Не бросает исключений — логирование не должно ломать основную операцию.
 */
export async function logAdminAction(
  adminUserId: string,
  action: AdminAction,
  targetId: string | null,
  targetEmail?: string | null,
  metadata: Record<string, unknown> = {},
  ipAddress?: string | null
): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("admin_logs").insert({
      user_id: adminUserId,
      action,
      target_id: targetId,
      target_email: targetEmail ?? null,
      metadata,
      ip_address: ipAddress ?? null,
    });
  } catch (err) {
    console.error("[admin_logs] failed to record action", action, err);
  }
}

/** IP из заголовков (аналог middleware) */
export function requestIp(req: NextRequest): string | null {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null
  );
}
