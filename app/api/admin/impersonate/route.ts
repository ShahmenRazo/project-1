import { NextRequest } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, adminErrorResponse } from "@/lib/admin/guard";
import { logAdminAction, requestIp } from "@/lib/admin/audit-log";

export const dynamic = "force-dynamic";

const IMPERSONATION_TTL_SECONDS = 15 * 60; // 15 минут

function signJwt(payload: Record<string, unknown>): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");

  const b64url = (o: object) =>
    Buffer.from(JSON.stringify(o)).toString("base64url");
  const header = b64url({ alg: "HS256", typ: "JWT" });
  const body = b64url(payload);
  const sig = crypto
    .createHmac("sha256", secret)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${sig}`;
}

// POST /api/admin/impersonate — временный JWT для входа как пользователь.
// Тело: { userId }. URL для входа: /api/auth/impersonate?token=... (15 мин).
export async function POST(req: NextRequest) {
  try {
    const adminUser = await requireAdmin();
    const admin = createAdminClient();

    const { userId } = (await req.json()) as { userId?: string };
    if (!userId) {
      return Response.json(
        { error: { message: "userId is required", code: "BAD_REQUEST" } },
        { status: 400 }
      );
    }

    const { data: target, error: targetError } = await admin
      .from("users")
      .select("email, banned")
      .eq("id", userId)
      .maybeSingle();
    if (targetError) throw targetError;
    if (!target) {
      return Response.json(
        { error: { message: "User not found", code: "NOT_FOUND" } },
        { status: 404 }
      );
    }
    if (target.banned) {
      return Response.json(
        { error: { message: "User is banned", code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    const now = Math.floor(Date.now() / 1000);
    const token = signJwt({
      role: "authenticated",
      aud: "authenticated",
      sub: userId,
      email: target.email,
      iat: now,
      exp: now + IMPERSONATION_TTL_SECONDS,
      impersonated_by: adminUser.id,
    });

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "https://kitstartai.com";
    const loginUrl = `${appUrl}/api/auth/impersonate?token=${encodeURIComponent(token)}`;

    await logAdminAction(
      adminUser.id,
      "impersonate",
      userId,
      target.email,
      { ttl_seconds: IMPERSONATION_TTL_SECONDS },
      requestIp(req)
    );

    return Response.json({
      token,
      expires_in: IMPERSONATION_TTL_SECONDS,
      login_url: loginUrl,
    });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
