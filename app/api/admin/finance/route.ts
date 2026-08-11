import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, adminErrorResponse } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

// GET /api/admin/finance — сводка + все Pro-транзакции
export async function GET(_req: NextRequest) {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    const { data: orders, error } = await admin
      .from("ls_orders")
      .select("id, email, amount, currency, status, payment_method, invoice_id, created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw error;

    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);

    let total = 0;
    let thisMonth = 0;
    let refunds = 0;
    for (const o of orders) {
      const amount = Number(o.amount);
      if (o.status === "refunded") refunds += amount;
      else if (o.status === "succeeded") {
        total += amount;
        if (new Date(o.created_at) >= monthStart) thisMonth += amount;
      }
    }

    return Response.json({
      data: {
        summary: {
          total_revenue: Math.round(total * 100) / 100,
          revenue_this_month: Math.round(thisMonth * 100) / 100,
          refunds: Math.round(refunds * 100) / 100,
          net_revenue: Math.round((total - refunds) * 100) / 100,
        },
        orders,
      },
    });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
