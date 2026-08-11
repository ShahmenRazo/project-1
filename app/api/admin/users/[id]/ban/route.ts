import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, adminErrorResponse } from "@/lib/admin/guard";
import { logAdminAction, requestIp } from "@/lib/admin/audit-log";
import { gotrueBan } from "@/lib/admin/gotrue";

export const dynamic = "force-dynamic";

// POST /api/admin/users/[id]/ban — soft-ban + блокировка входа
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminUser = await requireAdmin();
    const admin = createAdminClient();
    const { id } = params;

    const { data: target, error: targetError } = await admin
      .from("users")
      .select("email, role")
      .eq("id", id)
      .maybeSingle();
    if (targetError) throw targetError;
    if (!target) {
      return Response.json(
        { error: { message: "User not found", code: "NOT_FOUND" } },
        { status: 404 }
      );
    }
    if (target.role === "admin") {
      return Response.json(
        { error: { message: "Cannot ban an admin", code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    await gotrueBan(id, true);

    const { error } = await admin
      .from("users")
      .update({ banned: true })
      .eq("id", id);
    if (error) throw error;

    await logAdminAction(
      adminUser.id,
      "ban_user",
      id,
      target.email,
      {},
      requestIp(req)
    );

    return Response.json({ ok: true });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
