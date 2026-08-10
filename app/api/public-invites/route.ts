import { NextRequest } from "next/server";
import { z } from "zod";
import { customAlphabet } from "nanoid";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ApiError, fail, ok, parseBody, requireUser } from "@/lib/api";

const createSchema = z.object({
  group_id: z.string().uuid(),
  /** 0 = без лимита */
  max_uses: z.number().int().min(0).max(1000).optional().default(0),
  /** Дней до истечения; null/0 = без срока */
  expires_in_days: z.number().int().min(0).max(365).optional().default(0),
});

const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
const makeToken = customAlphabet(alphabet, 8);

/**
 * GET /api/public-invites?group_id= — активная публичная ссылка группы
 * (для кнопки в интерфейсе). Только для участников группы.
 *
 * POST /api/public-invites — создать публичную ссылку (только создатель).
 * Body: { group_id, max_uses?, expires_in_days? }
 */
export async function GET(request: NextRequest) {
  try {
    const groupId = request.nextUrl.searchParams.get("group_id");
    if (!groupId) {
      throw new ApiError(400, "group_id is required", "INVALID_GROUP");
    }

    const supabase = createClient();
    await requireUser(supabase);

    const admin = createAdminClient();
    const { data } = await admin
      .from("public_invites")
      .select("token, max_uses, uses_count, expires_at, created_at")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return ok({ invite: null });

    const active =
      (!data.expires_at || new Date(data.expires_at).getTime() > Date.now()) &&
      (data.max_uses === 0 || data.uses_count < data.max_uses);

    return ok({
      invite: active
        ? {
            token: data.token,
            url: `/join/${data.token}`,
            max_uses: data.max_uses,
            uses_count: data.uses_count,
            expires_at: data.expires_at,
          }
        : null,
    });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await parseBody(request, createSchema);

    const supabase = createClient();
    const user = await requireUser(supabase);

    // Только создатель группы
    const admin = createAdminClient();
    const { data: group } = await admin
      .from("groups")
      .select("creator_id")
      .eq("id", body.group_id)
      .maybeSingle();
    if (!group) {
      throw new ApiError(404, "Group not found", "GROUP_NOT_FOUND");
    }
    if (group.creator_id !== user.id) {
      throw new ApiError(
        403,
        "Only the group creator can create a public link",
        "FORBIDDEN"
      );
    }

    // Не плодим ссылки: переиспользуем активную, если она есть
    const { data: existing } = await admin
      .from("public_invites")
      .select("token, max_uses, uses_count, expires_at")
      .eq("group_id", body.group_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      const active =
        (!existing.expires_at ||
          new Date(existing.expires_at).getTime() > Date.now()) &&
        (existing.max_uses === 0 || existing.uses_count < existing.max_uses);
      if (active) {
        return ok({
          token: existing.token,
          url: `/join/${existing.token}`,
          reused: true,
        });
      }
    }

    const token = makeToken();
    const expiresAt =
      body.expires_in_days > 0
        ? new Date(Date.now() + body.expires_in_days * 86400_000).toISOString()
        : null;

    const { data: created, error } = await admin
      .from("public_invites")
      .insert({
        group_id: body.group_id,
        token,
        created_by: user.id,
        max_uses: body.max_uses,
        expires_at: expiresAt,
      })
      .select("token")
      .single();
    if (error) throw error;

    return ok({ token: created.token, url: `/join/${created.token}` }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
