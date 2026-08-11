import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ApiError, fail, isPgError, ok, parseBody, requireUser } from "@/lib/api";

export const dynamic = "force-dynamic";

const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,20}$/;
const VENMO_RE = /^[a-zA-Z0-9_.-]{2,32}$/;
const CASH_TAG_RE = /^[a-zA-Z0-9_-]{3,32}$/;
const ZELLE_RE =
  /^([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|\+?[0-9][0-9\s().-]{5,})$/;

/** Пустая строка = очистить поле, undefined = не трогать */
const optionalString = (check: RegExp) =>
  z
    .union([z.literal(""), z.string()])
    .optional()
    .transform((v) =>
      v === undefined || v === "" ? v : v.trim()
    )
    .pipe(
      z
        .union([z.literal(""), z.string().trim().regex(check)])
        .optional()
    );

const updateMeSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must be at most 20 characters")
      .regex(
        USERNAME_RE,
        "Username may contain only letters, digits, dot, dash and underscore"
      )
      .optional(),
    display_name: z
      .string()
      .trim()
      .min(1, "Name is required")
      .max(50, "Name must be at most 50 characters")
      .optional(),
    avatar_url: z
      .union([z.literal(""), z.string().url()])
      .optional()
      .transform((v) => (v === undefined || v === "" ? v : v.trim())),
    phone_number: z
      .union([z.literal(""), z.string()])
      .optional()
      .transform((v) => (v === undefined || v === "" ? v : v.trim())),
    onboarding_completed: z.boolean().optional(),
    venmo_username: optionalString(VENMO_RE),
    cash_tag: z
      .union([z.literal(""), z.string()])
      .optional()
      .transform((v) =>
        v === undefined || v === "" ? v : v.trim().replace(/^\$/, "")
      )
      .pipe(
        z
          .union([z.literal(""), z.string().regex(CASH_TAG_RE)])
          .optional()
      ),
    zelle_email: optionalString(ZELLE_RE),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "Nothing to update",
  });

// PUT /api/me — обновление профиля (username + payment handles).
export async function PUT(req: NextRequest) {
  try {
    const supabase = createClient();
    const user = await requireUser(supabase);
    const body = await parseBody(req, updateMeSchema);

    if (body.username) {
      const admin = createAdminClient();
      const { data: existing } = await admin
        .from("users")
        .select("id")
        .ilike("username", body.username)
        .neq("id", user.id)
        .maybeSingle();

      if (existing) {
        throw new ApiError(
          409,
          "This username is already taken",
          "USERNAME_TAKEN"
        );
      }
    }

    const update: {
      username?: string;
      display_name?: string;
      avatar_url?: string | null;
      phone_number?: string | null;
      onboarding_completed?: boolean;
      venmo_username?: string | null;
      cash_tag?: string | null;
      zelle_email?: string | null;
    } = {};
    if (body.username !== undefined) update.username = body.username;
    if (body.display_name !== undefined)
      update.display_name = body.display_name;
    if (body.avatar_url !== undefined) update.avatar_url = body.avatar_url;
    if (body.phone_number !== undefined)
      update.phone_number = body.phone_number;
    if (body.onboarding_completed !== undefined)
      update.onboarding_completed = body.onboarding_completed;
    if (body.venmo_username !== undefined)
      update.venmo_username = body.venmo_username;
    if (body.cash_tag !== undefined) update.cash_tag = body.cash_tag;
    if (body.zelle_email !== undefined) update.zelle_email = body.zelle_email;

    const { data: updated, error } = await supabase
      .from("users")
      .update(update)
      .eq("id", user.id)
      .select(
        "id, display_name, email, username, avatar_url, phone_number, onboarding_completed, venmo_username, cash_tag, zelle_email, subscription_tier"
      )
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
