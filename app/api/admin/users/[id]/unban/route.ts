import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, adminErrorResponse } from "@/lib/admin/guard";
import { logAdminAction, requestIp } from "@/lib/admin/audit-log";
import { gotrueBan } from "@/lib/admin/gotrue";

export const dynamic = "force-dynamic";

// POST /api/admin/users/[id]/unban — снятие блокировки
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminUser = await requireAdmin();
    const admin = createAdminClient();
    const { id } = params;

    await gotrueBan(id, false);

    const { error } = await admin
      .from("users")
      .update({ banned: false })
      .eq("id", id);
    if (error) throw error;

    const { data: target } = await admin
      .from("users")
      .select("email")
      .eq("id", id)
      .maybeSingle();

    await logAdminAction(
      adminUser.id,
      "unban_user",
      id,
      target?.email ?? null,
      {},
      requestIp(req)
    );

    return Response.json({ ok: true });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
