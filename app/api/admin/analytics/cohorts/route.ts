import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, adminErrorResponse } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

// GET /api/admin/analytics/cohorts — retention-когорты по месяцам (RPC admin_cohorts)
export async function GET(_req: NextRequest) {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    const { data, error } = await admin.rpc("admin_cohorts");
    if (error) throw error;

    return Response.json(data);
  } catch (err) {
    return adminErrorResponse(err);
  }
}
