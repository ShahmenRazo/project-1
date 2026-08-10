import { z } from "zod";
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fail, isPgError, ok, parseBody } from "@/lib/api";

const waitlistSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
});

// POST /api/waitlist — { email } → строка в waitlist (добавление с анонимного лендинга)
export async function POST(request: NextRequest) {
  try {
    const { email } = await parseBody(request, waitlistSchema);

    const supabase = createAdminClient();
    const { error } = await supabase.from("waitlist").insert({ email });

    if (error) {
      if (isPgError(error, "23505")) {
        return ok({ email, already_registered: true });
      }
      throw error;
    }

    return ok({ email, already_registered: false });
  } catch (error) {
    return fail(error);
  }
}
