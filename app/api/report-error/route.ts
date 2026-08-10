import { NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ApiError, fail, ok, parseBody } from "@/lib/api";

const reportSchema = z.object({
  message: z.string().max(2000).optional().default(""),
  stack: z.string().max(20000).optional().default(""),
  path: z.string().max(500).optional().default(""),
});

/**
 * POST /api/report-error — приём ошибок с клиента (error boundary).
 * Не требует авторизации, но user_id подставляется из сессии, если она есть.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await parseBody(request, reportSchema);

    let userId: string | null = null;
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    } catch {
      // без сессии — сохраняем анонимный отчёт
    }

    const admin = createAdminClient();
    const { error } = await admin.from("error_reports").insert({
      user_id: userId,
      message: body.message || null,
      stack: body.stack || null,
      path: body.path || null,
    });
    if (error) {
      throw new ApiError(500, "Failed to store report", "REPORT_FAILED");
    }

    return ok({ accepted: true }, { status: 202 });
  } catch (error) {
    return fail(error);
  }
}
