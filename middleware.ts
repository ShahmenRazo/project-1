import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * Защита роутов + rate limiting + обновление сессии Supabase:
 * - Rate limiting: /api/* — 30 req/min с одного IP, /api/auth/* — 10 req/min,
 *   /api/admin/* — 60 req/min, /api/billing/webhook — без лимита (LemonSqueezy).
 *   429 + Retry-After.
 * - /dashboard/*, /groups/*, /profile/* — только для авторизованных (иначе /login)
 * - /api/* — только для авторизованных (иначе 401 JSON);
 *   исключения: /api/billing/webhook (LemonSqueezy), /api/cron/* (Bearer CRON_SECRET),
 *   /api/invites/* (публичная проверка приглашения по токену),
 *   /api/public-invites/* (публичные ссылки: страницы сами проверяют авторизацию),
 *   /api/og (динамические OG-картинки для соцсетей)
 *   /api/waitlist (email-заявки с лендинга, анонимно)
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
            message: "Too many requests",
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
      global: {
        fetch: (input, init) =>
          fetch(input, { ...init, cache: "no-store" }),
      },
    }
  );

  // Проверка пользователя = обновление кук при истёкшем токене
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Legacy-дубли кук: в коротком окне деплоя сессия писалась ещё и с
  // Domain=.kitstartai.com, в браузерах накопились две генерации sb-auth-token
  // (host-only + domain) под одним именем. Вместе они раздувают Cookie-заголовок
  // за лимит Cloudflare (~8KB) → 400 Request Header Or Cookie Too Large (Safari).
  // Дубль = одно и то же имя куки встречается ≥2 раз (host-only + Domain-вариант).
  // Легитимный чанкинг (sb-auth-token + sb-auth-token.0) — имена разные, не трогаем.
  // Удаляем только Domain-варианты: Set-Cookie c Domain=.kitstartai.com + maxAge 0
  // (host-only генерация живёт дальше и обновляется обычным refresh).
  const dupCounter = new Map<string, number>();
  for (const c of request.cookies.getAll()) {
    if (c.name === "sb-auth-token" || c.name.startsWith("sb-auth-token.")) {
      dupCounter.set(c.name, (dupCounter.get(c.name) ?? 0) + 1);
    }
  }
  if ([...dupCounter.values()].some((n) => n >= 2)) {
    for (const name of dupCounter.keys()) {
      response.cookies.set(name, "", {
        path: "/",
        domain: ".kitstartai.com",
        maxAge: 0,
      });
    }
  }

  const isApi = pathname.startsWith("/api/");
  const isProtectedApi =
    isApi &&
    !pathname.startsWith("/api/billing/webhook") &&
    !pathname.startsWith("/api/cron/") &&
    !pathname.startsWith("/api/invites/") &&
    !pathname.startsWith("/api/public-invites/") &&
    !pathname.startsWith("/api/og") &&
    !pathname.startsWith("/api/waitlist") &&
    !pathname.startsWith("/api/auth/signup-complete") &&
    !pathname.startsWith("/api/check-username") &&
    !pathname.startsWith("/api/auth/impersonate");
  const isProtectedPage =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/groups") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/admin");

  if (user) {
    if (pathname === "/login") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Залогиненные с главной сразу идут в дашборд (незаполненный онбординг
    // перенаправит на /onboarding ниже). Гостям и краулерам лендинг остаётся.
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Обязательный онбординг: без куки onboarding_status=complete все страницы
    // (кроме /onboarding и /api/*) ведут на /onboarding. Кука ставится при
    // завершении онбординга (PUT /api/me) и на самой /onboarding, если профиль
    // уже заполнен, — это убирает лишние запросы к БД на каждом реквесте.
    const onboardingComplete =
      request.cookies.get("onboarding_status")?.value === "complete";
    if (
      !onboardingComplete &&
      pathname !== "/onboarding" &&
      !isApi
    ) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
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
