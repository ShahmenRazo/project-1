import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, adminErrorResponse, AdminError } from "@/lib/admin/guard";
import { logAdminAction, requestIp } from "@/lib/admin/audit-log";

export const dynamic = "force-dynamic";

const NAME_RE = /^[a-z0-9_]{2,50}$/;
const TARGETS = ["all", "pro_only", "beta_users"] as const;

// GET /api/admin/features — список всех флагов
export async function GET(_req: NextRequest) {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    const { data: flags, error } = await admin
      .from("feature_flags")
      .select("name, enabled, rollout_percent, target, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return Response.json({ data: { flags: flags ?? [] } });
  } catch (err) {
    return adminErrorResponse(err);
  }
}

// POST /api/admin/features — создать флаг
export async function POST(req: NextRequest) {
  try {
    const adminUser = await requireAdmin();
    const admin = createAdminClient();

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const enabled = Boolean(body.enabled);
    const rollout_percent = Number(body.rollout_percent ?? 100);
    const target = (body.target ?? "all") as (typeof TARGETS)[number];

    if (!NAME_RE.test(name)) {
      throw new AdminError(400, "Invalid flag name (a-z, 0-9, _)", "INVALID_NAME");
    }
    if (!Number.isInteger(rollout_percent) || rollout_percent < 0 || rollout_percent > 100) {
      throw new AdminError(400, "Rollout must be an integer 0–100", "INVALID_ROLLOUT");
    }
    if (!TARGETS.includes(target)) {
      throw new AdminError(400, "Invalid target", "INVALID_TARGET");
    }

    const { error } = await admin.from("feature_flags").insert({
      name,
      enabled,
      rollout_percent,
      target,
    });

    if (error) {
      if (error.code === "23505") {
        throw new AdminError(409, "Flag already exists", "DUPLICATE");
      }
      throw error;
    }

    await logAdminAction(
      adminUser.id,
      "flag_create",
      null,
      null,
      { name, enabled, rollout_percent, target },
      requestIp(req)
    );

    return Response.json({ data: { name } }, { status: 201 });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
