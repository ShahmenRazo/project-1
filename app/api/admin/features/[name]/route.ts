import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, adminErrorResponse, AdminError } from "@/lib/admin/guard";
import { logAdminAction, requestIp } from "@/lib/admin/audit-log";

export const dynamic = "force-dynamic";

const TARGETS = ["all", "pro_only", "beta_users"] as const;

// PATCH /api/admin/features/[name] — обновить флаг
export async function PATCH(
  req: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const adminUser = await requireAdmin();
    const admin = createAdminClient();
    const { name } = params;

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const patch: {
      enabled?: boolean;
      rollout_percent?: number;
      target?: (typeof TARGETS)[number];
    } = {};

    if (typeof body.enabled === "boolean") patch.enabled = body.enabled;
    if (body.rollout_percent !== undefined) {
      const rollout = Number(body.rollout_percent);
      if (!Number.isInteger(rollout) || rollout < 0 || rollout > 100) {
        throw new AdminError(400, "Rollout must be an integer 0–100", "INVALID_ROLLOUT");
      }
      patch.rollout_percent = rollout;
    }
    if (body.target !== undefined) {
      if (!TARGETS.includes(body.target as (typeof TARGETS)[number])) {
        throw new AdminError(400, "Invalid target", "INVALID_TARGET");
      }
      patch.target = body.target as (typeof TARGETS)[number];
    }
    if (Object.keys(patch).length === 0) {
      throw new AdminError(400, "Nothing to update", "EMPTY_PATCH");
    }

    const { data: existing, error: fetchError } = await admin
      .from("feature_flags")
      .select("name, enabled, rollout_percent, target")
      .eq("name", name)
      .maybeSingle();
    if (fetchError) throw fetchError;
    if (!existing) {
      throw new AdminError(404, "Flag not found", "NOT_FOUND");
    }

    const { error } = await admin.from("feature_flags").update(patch).eq("name", name);
    if (error) throw error;

    await logAdminAction(
      adminUser.id,
      "flag_update",
      null,
      null,
      { name, changes: patch },
      requestIp(req)
    );

    return Response.json({ data: { name, ...patch } });
  } catch (err) {
    return adminErrorResponse(err);
  }
}

// DELETE /api/admin/features/[name] — удалить флаг
export async function DELETE(
  req: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const adminUser = await requireAdmin();
    const admin = createAdminClient();
    const { name } = params;

    const { data: existing, error: fetchError } = await admin
      .from("feature_flags")
      .select("name, enabled, rollout_percent, target")
      .eq("name", name)
      .maybeSingle();
    if (fetchError) throw fetchError;
    if (!existing) {
      throw new AdminError(404, "Flag not found", "NOT_FOUND");
    }

    const { error } = await admin.from("feature_flags").delete().eq("name", name);
    if (error) throw error;

    await logAdminAction(
      adminUser.id,
      "flag_delete",
      null,
      null,
      { name },
      requestIp(req)
    );

    return Response.json({ ok: true });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
