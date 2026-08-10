import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Защита роутов + обновление сессии Supabase:
 * - /dashboard/*, /groups/*, /profile/* — только для авторизованных (иначе /login)
 * - /api/* — только для авторизованных (иначе 401 JSON);
 *   исключения: /api/billing/webhook (LemonSqueezy), /api/cron/* (Bearer CRON_SECRET),
 *   /api/invites/* (публичная проверка приглашения по токену)
 * - /login — для авторизованных редирект на /dashboard
 * - публичные: / (landing), /pricing, /auth/callback, /invite/[token]
 */
export async function middleware(request: NextRequest) {
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

  const { pathname } = request.nextUrl;

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
