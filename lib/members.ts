import { ApiError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MemberInput } from "@/lib/schemas";

export interface ResolvedMember {
  user_id: string;
  share_percent: number;
}

export interface MissingMember {
  email: string;
  share_percent: number;
}

export interface SoftResolveResult {
  resolved: ResolvedMember[];
  missing: MissingMember[];
}

/**
 * Резолвит user_id для каждого члена (по user_id или email).
 * Поиск по email идёт через admin client: таблица users закрыта RLS.
 * Бросает USER_NOT_FOUND, если email не найден.
 */
export async function resolveMemberUserIds(
  inputs: MemberInput[]
): Promise<ResolvedMember[]> {
  const { resolved, missing } = await resolveMemberUserIdsSoft(inputs);
  if (missing.length > 0) {
    throw new ApiError(
      400,
      `User with email ${missing[0].email} is not registered`,
      "USER_NOT_FOUND"
    );
  }
  return resolved;
}

/**
 * Мягкая версия: найденные пользователи возвращаются как есть,
 * ненайденные email — отдельно (для invite flow), без ошибки.
 */
export async function resolveMemberUserIdsSoft(
  inputs: MemberInput[]
): Promise<SoftResolveResult> {
  const admin = createAdminClient();
  const resolved: ResolvedMember[] = [];
  const missing: MissingMember[] = [];
  const seen = new Set<string>();
  const seenEmails = new Set<string>();

  for (const input of inputs) {
    if (input.user_id) {
      if (seen.has(input.user_id)) {
        throw new ApiError(400, "Duplicate member in request", "DUPLICATE_MEMBER");
      }
      seen.add(input.user_id);
      resolved.push({ user_id: input.user_id, share_percent: input.share_percent });
      continue;
    }

    const email = input.email!.toLowerCase();
    if (seenEmails.has(email)) {
      throw new ApiError(400, "Duplicate member in request", "DUPLICATE_MEMBER");
    }
    seenEmails.add(email);

    const { data, error } = await admin
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (error || !data) {
      missing.push({ email, share_percent: input.share_percent });
      continue;
    }

    if (seen.has(data.id)) {
      throw new ApiError(400, "Duplicate member in request", "DUPLICATE_MEMBER");
    }
    seen.add(data.id);
    resolved.push({ user_id: data.id, share_percent: input.share_percent });
  }

  return { resolved, missing };
}
