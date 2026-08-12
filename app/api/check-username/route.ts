import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ok, fail } from "@/lib/api";

export const dynamic = "force-dynamic";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

// GET /api/check-username?username=alex — доступность username
// (публичный, для онбординга и профиля)
export async function GET(request: NextRequest) {
  try {
    const value = (request.nextUrl.searchParams.get("username") ?? "")
      .trim()
      .toLowerCase();

    if (!USERNAME_RE.test(value)) {
      return ok({ available: false, invalid: true });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("users")
      .select("id")
      .ilike("username", value)
      .maybeSingle();

    if (error) throw error;

    return ok({ available: !data, invalid: false });
  } catch (error) {
    return fail(error);
  }
}
