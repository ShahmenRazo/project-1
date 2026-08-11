import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/impersonate?token=... — вход как пользователь.
 * Принимает временный JWT от POST /api/admin/impersonate, устанавливает
 * сессионную cookie (sb-auth-token) и редиректит в /dashboard.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const secret = process.env.JWT_SECRET;

  if (!token || !secret) {
    return NextResponse.redirect(
      new URL("/login?error=impersonation_failed", req.url)
    );
  }

  try {
    // Проверка подписи и срока
    const [header, payload, sig] = token.split(".");
    if (!header || !payload || !sig) throw new Error("malformed");

    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${header}.${payload}`)
      .digest("base64url");
    if (expected !== sig) throw new Error("bad signature");

    const claims = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as {
      role?: string;
      sub?: string;
      email?: string;
      exp?: number;
      impersonated_by?: string;
    };

    if (claims.role !== "authenticated" || !claims.sub) {
      throw new Error("bad claims");
    }
    if (!claims.exp || claims.exp < Math.floor(Date.now() / 1000)) {
      throw new Error("expired");
    }

    const now = Math.floor(Date.now() / 1000);
    const session = {
      access_token: token,
      refresh_token: "",
      expires_in: (claims.exp ?? now + 900) - now,
      expires_at: claims.exp,
      token_type: "bearer",
      user: {
        id: claims.sub,
        aud: "authenticated",
        role: "authenticated",
        email: claims.email,
        email_confirmed_at: new Date().toISOString(),
        app_metadata: { provider: "email" },
        user_metadata: {},
      },
    };

    const cookieValue =
      "base64-" +
      Buffer.from(JSON.stringify(session)).toString("base64url");

    const response = NextResponse.redirect(
      new URL("/dashboard", req.url),
      307
    );
    response.cookies.set("sb-auth-token", cookieValue, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: claims.exp ? claims.exp - now : 900,
    });
    return response;
  } catch {
    return NextResponse.redirect(
      new URL("/login?error=impersonation_failed", req.url),
      307
    );
  }
}
