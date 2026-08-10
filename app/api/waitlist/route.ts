import { z } from "zod";
import { NextRequest } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { fail, isPgError, ok, parseBody } from "@/lib/api";

const waitlistSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
});

// POST /api/waitlist — { email } → строка в waitlist + письмо-подтверждение.
// Идемпотентно: повторный email → 200, письмо не дублируется.
export async function POST(request: NextRequest) {
  try {
    const { email } = await parseBody(request, waitlistSchema);

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("waitlist")
      .insert({ email })
      .select("id")
      .maybeSingle();

    if (error && !isPgError(error, "23505")) {
      throw error;
    }

    const alreadyRegistered = !data;

    // Подтверждение по почте; сбой Resend не ломает заявку (логируем)
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM;
    if (!alreadyRegistered && apiKey && from) {
      try {
        await new Resend(apiKey).emails.send({
          from,
          to: email,
          subject: "You're on the list!",
          text: "You're on the list! We'll notify you when SubSplit launches.",
        });
      } catch (sendError) {
        console.error("[waitlist] resend failed:", sendError);
      }
    } else if (!alreadyRegistered && (!apiKey || !from)) {
      console.warn(
        "[waitlist] RESEND_API_KEY/RESEND_FROM not set — confirmation email skipped"
      );
    }

    return ok({ email, already_registered: alreadyRegistered });
  } catch (error) {
    return fail(error);
  }
}
