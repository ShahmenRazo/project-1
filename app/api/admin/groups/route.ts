import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, adminErrorResponse } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    const plan = req.nextUrl.searchParams.get("plan");

    const { data: groups, error } = await admin
      .from("groups")
      .select(
        "id, name, created_at, creator_id, users!groups_creator_id_fkey(email, display_name, subscription_tier), subscriptions(name, price, currency, billing_cycle)"
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    const groupIds = groups.map((g) => g.id);
    const { data: members, error: membersError } = await admin
      .from("group_members")
      .select("group_id")
      .in("group_id", groupIds);
    if (membersError) throw membersError;

    const memberCounts = new Map<string, number>();
    for (const m of members) {
      memberCounts.set(m.group_id, (memberCounts.get(m.group_id) ?? 0) + 1);
    }

    let rows = groups.map((g) => ({
      id: g.id,
      name: g.name,
      created_at: g.created_at,
      creator_email: g.users?.email ?? null,
      creator_name: g.users?.display_name ?? null,
      creator_plan: g.users?.subscription_tier ?? "free",
      member_count: memberCounts.get(g.id) ?? 0,
      subscription: g.subscriptions
        ? {
            name: g.subscriptions.name,
            price: g.subscriptions.price,
            currency: g.subscriptions.currency,
            billing_cycle: g.subscriptions.billing_cycle,
          }
        : null,
    }));

    if (plan === "free" || plan === "pro") {
      rows = rows.filter((g) => g.creator_plan === plan);
    }

    return Response.json({ data: { groups: rows, total: rows.length } });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
