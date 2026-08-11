import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ApiError, fail, isPgError, ok, parseBody, requireUser } from "@/lib/api";

export const dynamic = "force-dynamic";

const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,20}$/;

const updateMeSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(
      USERNAME_RE,
      "Username may contain only letters, digits, dot, dash and underscore"
    ),
});

// PUT /api/me — обновление профиля (username).
export async function PUT(req: NextRequest) {
  try {
    const supabase = createClient();
    const user = await requireUser(supabase);
    const body = await parseBody(req, updateMeSchema);
    const username = body.username;

    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("users")
      .select("id")
      .ilike("username", username)
      .neq("id", user.id)
      .maybeSingle();

    if (existing) {
      throw new ApiError(
        409,
        "This username is already taken",
        "USERNAME_TAKEN"
      );
    }

    const { data: updated, error } = await supabase
      .from("users")
      .update({ username })
      .eq("id", user.id)
      .select("id, display_name, email, username, subscription_tier")
      .single();

    if (error) {
      if (isPgError(error, "23505")) {
        throw new ApiError(
          409,
          "This username is already taken",
          "USERNAME_TAKEN"
        );
      }
      throw error;
    }

    return ok({ user: updated });
  } catch (error) {
    return fail(error);
  }
}
