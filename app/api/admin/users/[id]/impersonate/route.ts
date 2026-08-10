import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, adminErrorResponse } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

/**
 * Impersonation: генерирует magic link для входа как пользователь.
 * Админ открывает ссылку в инкогнито-окне — попадает в аккаунт пользователя.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const { id } = params;

    const { data: profile, error: profileError } = await admin
      .from("users")
      .select("email")
      .eq("id", id)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile) {
      return Response.json(
        { error: { message: "User not found", code: "NOT_FOUND" } },
        { status: 404 }
      );
    }

    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: profile.email,
    });

    if (error || !data?.properties?.action_link) {
      return Response.json(
        {
          error: {
            message: "Failed to generate magic link",
            code: "LINK_FAILED",
          },
        },
        { status: 500 }
      );
    }

    return Response.json({ data: { url: data.properties.action_link } });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
