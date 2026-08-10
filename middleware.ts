import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * Защита роутов + rate limiting + обновление сессии Supabase:
 * - Rate limiting: /api/* — 30 req/min с одного IP, /api/auth/* — 10 req/min,
 *   /api/billing/webhook — без лимита (LemonSqueezy). 429 + Retry-After.
 * - /dashboard/*, /groups/*, /profile/* — только для авторизованных (иначе /login)
 * - /api/* — только для авторизованных (иначе 401 JSON);
 *   исключения: /api/billing/webhook (LemonSqueezy), /api/cron/* (Bearer CRON_SECRET),
 *   /api/invites/* (публичная проверка приглашения по токену)
 * - /login — для авторизованных редирект на /dashboard
 * - публичные: / (landing), /pricing, /auth/callback, /invite/[token]
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ---------- Rate limiting (только /api/*) ----------
  if (pathname.startsWith("/api/")) {
    const ip =
      request.headers.get("cf-connecting-ip") ??
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";

    const { limited, retryAfter } = await checkRateLimit(pathname, ip);

    if (limited) {
      return NextResponse.json(
        {
          error: {
            message: "Too many requests, slow down",
            code: "RATE_LIMITED",
          },
        },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfter) },
        }
      );
    }
  }

  // ---------- Авторизация ----------
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { name: "sb-auth-token" },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Проверка пользователя = обновление кук при истёкшем токене
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isApi = pathname.startsWith("/api/");
  const isProtectedApi =
    isApi &&
    !pathname.startsWith("/api/billing/webhook") &&
    !pathname.startsWith("/api/cron/") &&
    !pathname.startsWith("/api/invites/");
  const isProtectedPage =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/groups") ||
    pathname.startsWith("/profile");

  if (user) {
    if (pathname === "/login") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return response;
  }

  if (isProtectedApi) {
    return NextResponse.json(
      { error: { message: "Unauthorized", code: "UNAUTHORIZED" } },
      { status: 401 }
    );
  }

  if (isProtectedPage) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.webmanifest|sw.js|workbox-|worker-).*)",
  ],
};
