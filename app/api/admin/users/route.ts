import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, adminErrorResponse } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

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
    const q = (params.get("q") ?? "").trim();

    let query = admin
      .from("users")
      .select("id, email, display_name, subscription_tier, plan_status, role, created_at, last_active, country", {
        count: "exact",
      });

    if (q) {
      query = query.ilike("email", `%${q}%`);
    }

    const from = (page - 1) * pageSize;
    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) throw error;

    const userIds = data.map((u) => u.id);

    // Счётчики: подписки и группы для каждой строки
    const [subsRes, gmRes] = await Promise.all([
      admin
        .from("subscriptions")
        .select("user_id")
        .is("deleted_at", null)
        .in("user_id", userIds),
      admin
        .from("group_members")
        .select("user_id, group_id")
        .in("user_id", userIds),
    ]);
    if (subsRes.error) throw subsRes.error;
    if (gmRes.error) throw gmRes.error;

    const subsCount = new Map<string, number>();
    for (const s of subsRes.data) subsCount.set(s.user_id, (subsCount.get(s.user_id) ?? 0) + 1);
    const groupsCount = new Map<string, number>();
    for (const gm of gmRes.data) groupsCount.set(gm.user_id, (groupsCount.get(gm.user_id) ?? 0) + 1);

    const users = data.map((u) => ({
      ...u,
      subscriptions_count: subsCount.get(u.id) ?? 0,
      groups_count: groupsCount.get(u.id) ?? 0,
    }));

    return Response.json({
      data: { users, total: count ?? 0, page, page_size: pageSize },
    });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
