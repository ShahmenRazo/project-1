import { ApiError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MemberInput } from "@/lib/schemas";

export interface ResolvedMember {
  user_id: string;
  share_percent: number;
}

/**
 * Резолвит user_id для каждого члена (по user_id или email).
 * Поиск по email идёт через admin client: таблица users закрыта RLS.
 */
export async function resolveMemberUserIds(
  inputs: MemberInput[]
): Promise<ResolvedMember[]> {
  const admin = createAdminClient();
  const result: ResolvedMember[] = [];
  const seen = new Set<string>();

  for (const input of inputs) {
    let userId = input.user_id;

    if (!userId) {
      const { data, error } = await admin
        .from("users")
        .select("id")
        .eq("email", input.email!.toLowerCase())
        .maybeSingle();

      if (error || !data) {
        throw new ApiError(
          400,
          `User with email ${input.email} is not registered`,
          "USER_NOT_FOUND"
        );
      }
      userId = data.id;
    }

    if (seen.has(userId)) {
      throw new ApiError(400, "Duplicate member in request", "DUPLICATE_MEMBER");
    }
    seen.add(userId);

    result.push({ user_id: userId, share_percent: input.share_percent });
  }

  return result;
}
