import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ApiError, fail, ok, parseBody, requireUser } from "@/lib/api";

const deleteSchema = z.object({
  password: z.string().min(1),
});

/**
 * DELETE /api/delete-account — право на забвение (GDPR art. 17).
 * Требует подтверждения паролем. Удаляет auth-пользователя через
 * service role; все связанные данные (подписки, группы, доли, долги,
 * уведомления, push-токены) удаляются каскадно по FK.
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await parseBody(request, deleteSchema);

    const supabase = createClient();
    const user = await requireUser(supabase);

    if (!user.email) {
      throw new ApiError(400, "Account has no email", "NO_EMAIL");
    }

    // Подтверждение паролем
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: body.password,
    });

    if (signInError) {
      const providers: string[] =
        (user.app_metadata?.providers as string[]) ?? [];
      if (providers.length && !providers.includes("email")) {
        throw new ApiError(
          400,
          "Account uses social sign-in and has no password",
          "NO_PASSWORD"
        );
      }
      throw new ApiError(403, "Wrong password", "WRONG_PASSWORD");
    }

    // Удаляем пользователя и всё связанное (FK on delete cascade)
    const admin = createAdminClient();
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) {
      throw new ApiError(500, "Failed to delete account", "DELETE_FAILED");
    }

    return ok({ deleted: true });
  } catch (error) {
    return fail(error);
  }
}
