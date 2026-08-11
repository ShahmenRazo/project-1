import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Rate limiting через Upstash Redis (REST API, работает на Edge).
 *
 * Если UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN не заданы —
 * лимиты отключены (graceful fallback для локальной разработки).
 * Безопасно: без Redis сервис работает, но без защиты.
 */
const REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const isConfigured = Boolean(REST_URL && REST_TOKEN);

// Общие лимиты для всех /api/*
const apiLimiter = isConfigured
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(30, "1 m"),
      prefix: "ratelimit:api",
    })
  : null;

// Ужесточённый лимит для /api/auth/* (защита от брутфорса)
const authLimiter = isConfigured
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      prefix: "ratelimit:auth",
    })
  : null;

// Расширенный лимит для /api/admin/* (частые запросы панели)
const adminLimiter = isConfigured
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(60, "1 m"),
      prefix: "ratelimit:admin",
    })
  : null;

export interface RateLimitResult {
  limited: boolean;
  /** Секунды до сброса лимита (для Retry-After) */
  retryAfter: number;
}

/**
 * Проверка лимита для пути и IP.
 * Порядок приоритета: /api/auth/* (10/мин) → /api/admin/* (60/мин) →
 * /api/billing/webhook (без лимита) → остальные /api/* (30/мин).
 */
export async function checkRateLimit(
  pathname: string,
  ip: string
): Promise<RateLimitResult> {
  // Webhook LemonSqueezy приходит с их серверов — лимиты не применяем
  if (pathname.startsWith("/api/billing/webhook")) {
    return { limited: false, retryAfter: 0 };
  }

  const limiter = pathname.startsWith("/api/auth/")
    ? authLimiter
    : pathname.startsWith("/api/admin/")
      ? adminLimiter
      : apiLimiter;

  if (!limiter) {
    return { limited: false, retryAfter: 0 };
  }

  const identifier = ip || "unknown";
  const { success, reset } = await limiter.limit(identifier);

  const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));

  if (!success) {
    return { limited: true, retryAfter };
  }

  return { limited: false, retryAfter: 0 };
}
