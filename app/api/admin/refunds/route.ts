import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, adminErrorResponse } from "@/lib/admin/guard";
import { logAdminAction, requestIp } from "@/lib/admin/audit-log";

export const dynamic = "force-dynamic";

const LS_API = "https://api.lemonsqueezy.com/v1";

// POST /api/admin/refunds — возврат по заказу LemonSqueezy.
// Тело: { orderId } — id записи в ls_orders (не LS-номер заказа).
export async function POST(req: NextRequest) {
  try {
    const adminUser = await requireAdmin();
    const admin = createAdminClient();

    const apiKey = process.env.LEMONSQUEEZY_API_KEY;
    if (!apiKey) {
      return Response.json(
        {
          error: {
            message: "LemonSqueezy API key is not configured",
            code: "NOT_CONFIGURED",
          },
        },
        { status: 500 }
      );
    }

    const { orderId } = (await req.json()) as { orderId?: string };
    if (!orderId) {
      return Response.json(
        { error: { message: "orderId is required", code: "BAD_REQUEST" } },
        { status: 400 }
      );
    }

    const { data: order, error: orderError } = await admin
      .from("ls_orders")
      .select("id, user_id, email, amount, status, invoice_id, ls_order_id")
      .eq("id", orderId)
      .maybeSingle();
    if (orderError) throw orderError;
    if (!order) {
      return Response.json(
        { error: { message: "Order not found", code: "NOT_FOUND" } },
        { status: 404 }
      );
    }
    if (order.status === "refunded") {
      return Response.json(
        { error: { message: "Order already refunded", code: "CONFLICT" } },
        { status: 409 }
      );
    }

    // LemonSqueezy: возврат создаётся по идентификатору заказа (order id),
    // а не по подписке. Если ls_order_id — это подписка, для реальных
    // данных требуется order_id из LS; в демо-режиме без реального заказа
    // API вернёт ошибку — она будет проброшена в ответ.
    let lsRefund: unknown = null;
    try {
      const lsRes = await fetch(`${LS_API}/refunds`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json",
        },
        body: JSON.stringify({
          data: {
            type: "refunds",
            attributes: {
              order_id: order.ls_order_id ?? order.invoice_id,
              amount: Number(order.amount),
            },
          },
        }),
      });
      if (!lsRes.ok) {
        const body = await lsRes.text();
        throw new Error(`LemonSqueezy refund failed (${lsRes.status}): ${body.slice(0, 300)}`);
      }
      lsRefund = await lsRes.json();
    } catch (err) {
      return Response.json(
        { error: { message: String(err), code: "LS_REFUND_FAILED" } },
        { status: 502 }
      );
    }

    const { error } = await admin
      .from("ls_orders")
      .update({ status: "refunded" })
      .eq("id", orderId);
    if (error) throw error;

    await logAdminAction(
      adminUser.id,
      "refund",
      order.user_id,
      order.email,
      { order_id: orderId, amount: Number(order.amount) },
      requestIp(req)
    );

    return Response.json({ ok: true, refund: lsRefund });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
