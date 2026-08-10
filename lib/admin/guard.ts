import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminActor = {
  id: string;
  email: string;
};

export class AdminError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = "ADMIN_ERROR"
  ) {
    super(message);
  }
}

/**
 * Проверяет, что вызывающий — авторизованный пользователь с ролью admin.
 * Использует сессию из кук + service_role для чтения роли.
 */
export async function requireAdmin(): Promise<AdminActor> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new AdminError(401, "Unauthorized", "UNAUTHORIZED");
  }

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("users")
    .select("id, email, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new AdminError(500, "Failed to verify admin role");
  }
  if (!profile || profile.role !== "admin") {
    throw new AdminError(403, "Forbidden: admin role required", "FORBIDDEN");
  }

  return { id: profile.id, email: profile.email };
}

export function adminErrorResponse(err: unknown): Response {
  if (err instanceof AdminError) {
    return Response.json(
      { error: { message: err.message, code: err.code } },
      { status: err.status }
    );
  }
  console.error("[admin] unexpected error:", err);
  return Response.json(
    { error: { message: "Internal server error", code: "INTERNAL" } },
    { status: 500 }
  );
}
