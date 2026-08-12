import { NextRequest } from "next/server";
import { z } from "zod";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ApiError, fail, ok, parseBody } from "@/lib/api";

export const dynamic = "force-dynamic";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
const VENMO_RE = /^[a-zA-Z0-9_.-]{2,32}$/;
const CASH_TAG_RE = /^[a-zA-Z0-9_-]{3,32}$/;
const ZELLE_RE =
  /^([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|\+?[0-9][0-9\s().-]{5,})$/;
const AVATAR_DATA_RE = /^data:image\/(jpeg|png|webp);base64,/;
const MAX_AVATAR_BYTES = 512 * 1024;

const optionalString = (check: RegExp) =>
  z
    .union([z.literal(""), z.string()])
    .optional()
    .transform((v) => (v === undefined || v === "" ? v : v.trim()))
    .pipe(
      z.union([z.literal(""), z.string().trim().regex(check)]).optional()
    );

function normalizePhone(value: string | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === "") return null;
  const parsed = parsePhoneNumberFromString(value);
  if (!parsed || !parsed.isValid()) {
    throw new ApiError(400, "Enter a valid phone number", "INVALID_PHONE");
  }
  return parsed.format("E.164");
}

const signupSchema = z
  .object({
    email: z.string().trim().email("Enter a valid email").toLowerCase(),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(72),
    confirm_password: z.string().min(1, "Confirm your password"),
    username: z
      .string()
      .trim()
      .regex(USERNAME_RE, "Username: 3–20 chars, letters, digits or underscore"),
    display_name: z
      .string()
      .trim()
      .min(1, "Display name is required")
      .max(50, "Display name must be at most 50 characters"),
    phone_number: z.string().trim().min(1, "Phone number is required"),
    avatar_data: z
      .union([z.literal(""), z.string().regex(AVATAR_DATA_RE)])
      .optional(),
    venmo_username: optionalString(VENMO_RE),
    cash_tag: z
      .union([z.literal(""), z.string()])
      .optional()
      .transform((v) =>
        v === undefined || v === "" ? v : v.trim().replace(/^\$/, "")
      )
      .pipe(z.union([z.literal(""), z.string().regex(CASH_TAG_RE)]).optional()),
    zelle_email: optionalString(ZELLE_RE),
    zelle_phone: z
      .union([z.literal(""), z.string()])
      .optional()
      .transform((v) => (v === undefined || v === "" ? v : v.trim())),
  })
  .refine((v) => v.password === v.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  })
  .refine(
    (v) =>
      Boolean(
        (v.venmo_username && v.venmo_username !== "") ||
          (v.cash_tag && v.cash_tag !== "") ||
          (v.zelle_email && v.zelle_email !== "") ||
          (v.zelle_phone && v.zelle_phone !== "")
      ),
    {
      message: "Add at least one payment handle (Venmo, Cash App or Zelle)",
      path: ["venmo_username"],
    }
  );

// POST /api/auth/signup-complete — регистрация с полным профилем.
// Создаёт auth.user (signUp) + строку в users (триггер on_auth_user_created
// создаёт её автоматически, здесь заполняем профиль service-ключом).
// Если профиль не удалось заполнить — 500, но пользователь сможет залогиниться
// и дописать профиль на /onboarding (ловит middleware).
export async function POST(req: NextRequest) {
  try {
    const body = await parseBody(req, signupSchema);
    const phone = normalizePhone(body.phone_number);
    const zellePhone = normalizePhone(body.zelle_phone);
    if (!phone) {
      throw new ApiError(400, "Enter a valid phone number", "INVALID_PHONE");
    }

    const admin = createAdminClient();

    const { data: takenUsername } = await admin
      .from("users")
      .select("id")
      .ilike("username", body.username)
      .maybeSingle();
    if (takenUsername) {
      throw new ApiError(409, "This username is already taken", "USERNAME_TAKEN");
    }

    const { data: takenPhone } = await admin
      .from("users")
      .select("id")
      .eq("phone_number", phone)
      .maybeSingle();
    if (takenPhone) {
      throw new ApiError(
        409,
        "This phone number is already in use",
        "PHONE_TAKEN"
      );
    }

    const supabase = createClient();
    const { data: signupData, error: signupError } = await supabase.auth.signUp(
      {
        email: body.email,
        password: body.password,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://kitstartai.com"}/auth/callback`,
        },
      }
    );

    if (signupError) {
      if (
        signupError.message.toLowerCase().includes("already") ||
        signupError.code === "user_already_exists"
      ) {
        throw new ApiError(409, "This email is already registered", "EMAIL_TAKEN");
      }
      throw signupError;
    }

    const userId = signupData.user?.id;
    if (!userId) {
      throw new ApiError(500, "Could not create account", "SIGNUP_FAILED");
    }

    // Аватар: data URL → upload в storage (service key)
    let avatarUrl: string | null = null;
    if (body.avatar_data) {
      const base64 = body.avatar_data.split(",")[1];
      const buffer = Buffer.from(base64, "base64");
      if (buffer.byteLength > MAX_AVATAR_BYTES) {
        throw new ApiError(400, "Avatar is too large", "AVATAR_TOO_LARGE");
      }
      const path = `${userId}/avatar.jpg`;
      const { error: uploadError } = await admin.storage
        .from("avatars")
        .upload(path, buffer, { upsert: true, contentType: "image/jpeg" });
      if (!uploadError) {
        const { data } = admin.storage.from("avatars").getPublicUrl(path);
        avatarUrl = data.publicUrl;
      }
    }

    const update = {
      username: body.username,
      display_name: body.display_name,
      phone_number: phone,
      avatar_url: avatarUrl,
      venmo_username: body.venmo_username ?? null,
      cash_tag: body.cash_tag ?? null,
      zelle_email: body.zelle_email ?? null,
      zelle_phone: zellePhone ?? null,
      onboarding_completed: true,
    };

    const { data: profile, error: updateError } = await admin
      .from("users")
      .update(update)
      .eq("id", userId)
      .select(
        "id, email, username, display_name, phone_number, avatar_url, venmo_username, cash_tag, zelle_email, zelle_phone, onboarding_completed"
      )
      .single();

    if (updateError) {
      throw new ApiError(
        500,
        "Account created, but profile setup failed. Log in and finish setup.",
        "PROFILE_CREATION_FAILED"
      );
    }

    const response = ok({
      user: signupData.user,
      session: signupData.session,
      profile,
    });
    response.cookies.set("onboarding_status", "complete", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
    return response;
  } catch (error) {
    return fail(error);
  }
}
