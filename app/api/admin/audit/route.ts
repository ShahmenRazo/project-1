import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, adminErrorResponse } from "@/lib/admin/guard";
import type { Database } from "@/lib/database.types";

export const dynamic = "force-dynamic";

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

// GET /api/admin/audit — список действий админов (пагинация, фильтр по действию)
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    const params = req.nextUrl.searchParams;
    const page = Math.max(1, Number(params.get("page") ?? "1") || 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Number(params.get("pageSize") ?? String(DEFAULT_PAGE_SIZE)) || DEFAULT_PAGE_SIZE)
    );
    const action = (params.get("action") ?? "").trim();

    let query = admin
      .from("admin_logs")
      .select(
        "id, user_id, action, target_id, target_email, metadata, ip_address, created_at, users(email)",
        { count: "exact" }
      );

    if (action)
      query = query.eq(
        "action",
        action as Database["public"]["Tables"]["admin_logs"]["Row"]["action"]
      );

    const from = (page - 1) * pageSize;
    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) throw error;

    return Response.json({
      data: {
        logs: data,
        total: count ?? 0,
        page,
        pageSize,
      },
    });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
