import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { ApiError, fail, ok, parseBody } from "@/lib/api";

export const dynamic = "force-dynamic";

const resendSchema = z.object({
  email: z.string().email(),
});

// POST /api/auth/resend-verification — повторная отправка письма подтверждения
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const body = await parseBody(request, resendSchema);

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: body.email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/callback`,
      },
    });

    if (error) {
      throw new ApiError(400, error.message, "RESEND_FAILED");
    }

    return ok({ sent: true });
  } catch (error) {
    return fail(error);
  }
}
