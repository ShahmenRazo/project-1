import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, adminErrorResponse } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const { id } = params;

    const admin = createAdminClient();

    const { data: existing, error: checkError } = await admin
      .from("users")
      .select("id, subscription_tier")
      .eq("id", id)
      .maybeSingle();
    if (checkError) throw checkError;
    if (!existing) {
      return Response.json(
        { error: { message: "User not found", code: "NOT_FOUND" } },
        { status: 404 }
      );
    }

    // Toggle Pro: ручное включение/выключение для поддержки
    const turningOn = existing.subscription_tier !== "pro";
    const { error } = await admin
      .from("users")
      .update(
        turningOn
          ? { subscription_tier: "pro", plan_status: "active" }
          : { subscription_tier: "free", plan_status: "none" }
      )
      .eq("id", id);
    if (error) throw error;

    return Response.json({ data: { pro: turningOn } });
  } catch (err) {
    return adminErrorResponse(err);
  }
}