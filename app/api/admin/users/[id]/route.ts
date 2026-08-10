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
  groups: { name: string } | null;
  payments_from: { email: string | null; display_name: string | null } | null;
  payments_to: { email: string | null; display_name: string | null } | null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const { id } = params;

    const { data: profile, error: profileError } = await admin
      .from("users")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile) {
      return Response.json(
        { error: { message: "User not found", code: "NOT_FOUND" } },
        { status: 404 }
      );
    }

    const [subsRes, createdGroupsRes, memberGroupsRes, paymentsRes] =
      await Promise.all([
        admin
          .from("subscriptions")
          .select("*")
          .is("deleted_at", null)
          .eq("user_id", id),
        admin
          .from("groups")
          .select("*, subscriptions(name, price, currency, billing_cycle), users!groups_creator_id_fkey(email, display_name)")
          .eq("creator_id", id),
        admin
          .from("group_members")
          .select("group_id, groups(name, creator_id)"),
        admin
          .from("payments")
          .select(
            "id, amount, currency, status, due_date, created_at, group_id, groups(name), users!payments_from_user_id_fkey!payments_from(email, display_name), users!payments_to_user_id_fkey!payments_to(email, display_name)"
          )
          .or(`from_user_id.eq.${id},to_user_id.eq.${id}`)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);
    if (subsRes.error) throw subsRes.error;
    if (createdGroupsRes.error) throw createdGroupsRes.error;
    if (memberGroupsRes.error) throw memberGroupsRes.error;
    if (paymentsRes.error) throw paymentsRes.error;

    const memberGroups = memberGroupsRes.data
      .filter((gm) => gm.groups && gm.groups.creator_id !== id)
      .map((gm) => ({ id: gm.group_id, name: gm.groups!.name }));

    const payments = (paymentsRes.data as unknown as PaymentRow[]).map((p) => ({
      id: p.id,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      due_date: p.due_date,
      created_at: p.created_at,
      group_name: p.groups?.name ?? null,
      from_email: p.payments_from?.email ?? null,
      from_name: p.payments_from?.display_name ?? null,
      to_email: p.payments_to?.email ?? null,
      to_name: p.payments_to?.display_name ?? null,
    }));

    return Response.json({
      data: {
        profile,
        subscriptions: subsRes.data,
        groups: [...createdGroupsRes.data, ...memberGroups],
        payments,
      },
    });
  } catch (err) {
    return adminErrorResponse(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const actor = await requireAdmin();
    const { id } = params;

    if (id === actor.id) {
      return Response.json(
        { error: { message: "Cannot delete your own admin account", code: "SELF_DELETE" } },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Проверяем, что пользователь существует
    const { data: existing, error: checkError } = await admin
      .from("users")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (checkError) throw checkError;
    if (!existing) {
      return Response.json(
        { error: { message: "User not found", code: "NOT_FOUND" } },
        { status: 404 }
      );
    }

    // GoTrue admin API: удаляет auth.users, каскадно чистит public.users,
    // subscriptions, groups, group_members, payments, notifications
    const { error: deleteError } = await admin.auth.admin.deleteUser(id);
    if (deleteError) throw deleteError;

    return Response.json({ data: { deleted: true } });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
