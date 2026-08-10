import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, adminErrorResponse } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

interface PaymentRow {
  id: string;
  amount: number;
  currency: string;
  status: string;
  due_date: string | null;
  created_at: string;
  paid_at: string | null;
  groups: { name: string } | null;
  payments_from: { email: string | null; display_name: string | null } | null;
  payments_to: { email: string | null; display_name: string | null } | null;
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    const status = req.nextUrl.searchParams.get("status");

    let query = admin
      .from("payments")
      .select(
        "id, amount, currency, status, due_date, created_at, paid_at, group_id, groups(name), users!payments_from_user_id_fkey!payments_from(email, display_name), users!payments_to_user_id_fkey!payments_to(email, display_name)"
      );

    if (status === "pending" || status === "paid") {
      query = query.eq("status", status);
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw error;

    const rows = data as unknown as PaymentRow[];

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
          from_email: p.payments_from?.email ?? null,
          from_name: p.payments_from?.display_name ?? null,
          to_email: p.payments_to?.email ?? null,
          to_name: p.payments_to?.display_name ?? null,
        })),
      },
    });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
