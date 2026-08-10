import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, adminErrorResponse } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

interface UserRef {
  email: string | null;
  display_name: string | null;
}

interface PaymentRow {
  id: string;
  amount: number;
  currency: string;
  status: string;
  due_date: string | null;
  created_at: string;
  paid_at: string | null;
  groups: { name: string } | null;
}

// PostgREST 14.12 не умеет два FK-embed'а payments->users в одном select
// (баг: "payments_users_1 specified more than once"), поэтому users
// подтягиваются двумя отдельными запросами и сливаются по id.
async function fetchUsers(
  admin: ReturnType<typeof createAdminClient>,
  ids: string[],
  fk: "payments_from_user_id_fkey" | "payments_to_user_id_fkey"
): Promise<Map<string, UserRef>> {
  const map = new Map<string, UserRef>();
  if (ids.length === 0) return map;
  const { data, error } = await admin
    .from("payments")
    .select(`id, users!${fk}(email, display_name)`)
    .in("id", ids);
  if (error) throw error;
  for (const row of data as unknown as { id: string; users: UserRef | null }[]) {
    if (row.users) map.set(row.id, row.users);
  }
  return map;
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    const status = req.nextUrl.searchParams.get("status");

    let query = admin
      .from("payments")
      .select("id, amount, currency, status, due_date, created_at, paid_at, group_id, groups(name)");

    if (status === "pending" || status === "paid") {
      query = query.eq("status", status);
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw error;

    const rows = data as unknown as PaymentRow[];
    const ids = rows.map((p) => p.id);
    const [fromMap, toMap] = await Promise.all([
      fetchUsers(admin, ids, "payments_from_user_id_fkey"),
      fetchUsers(admin, ids, "payments_to_user_id_fkey"),
    ]);

    return Response.json({
      data: {
        payments: rows.map((p) => ({
          id: p.id,
          amount: p.amount,
          currency: p.currency,
          status: p.status,
          due_date: p.due_date,
          created_at: p.created_at,
          paid_at: p.paid_at,
          group_name: p.groups?.name ?? null,
          from_email: fromMap.get(p.id)?.email ?? null,
          from_name: fromMap.get(p.id)?.display_name ?? null,
          to_email: toMap.get(p.id)?.email ?? null,
          to_name: toMap.get(p.id)?.display_name ?? null,
        })),
      },
    });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
