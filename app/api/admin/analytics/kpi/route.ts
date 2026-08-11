import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, adminErrorResponse } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

// GET /api/admin/analytics/kpi — 6 метрик + рост за 90 дней (RPC admin_kpi)
export async function GET(_req: NextRequest) {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    const { data, error } = await admin.rpc("admin_kpi");
    if (error) throw error;

    return Response.json(data);
  } catch (err) {
    return adminErrorResponse(err);
  }
}
