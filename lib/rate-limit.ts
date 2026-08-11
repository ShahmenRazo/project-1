import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Rate limiting.
 *
 * Приоритет: Upstash Redis (REST API, работает и на Edge) → если
 * UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN не заданы, используется
 * in-memory sliding window (fallback для одного процесса — локальная
 * разработка и single-node VPS). Без Redis защита работает, но не
 * распределяется между процессами.
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

/**
 * In-memory fallback: скользящее окно в 60 секунд на (путь, IP).
 * Map<`${path}|${ip}`, number[]> — массив таймстампов запросов.
 */
const memoryBuckets = new Map<string, number[]>();
const MEMORY_PRUNE_MS = 60_000;

function memoryLimit(
  key: string,
  limit: number,
  windowMs: number
): { limited: boolean; retryAfter: number } {
  const now = Date.now();
  const cutoff = now - windowMs;

  const buckets = memoryBuckets.get(key) ?? [];
  const recent = buckets.filter((t) => t > cutoff);

  if (recent.length >= limit) {
    const retryAfter = Math.max(
      1,
      Math.ceil((recent[0] - cutoff) / 1000)
    );
    memoryBuckets.set(key, recent);
    return { limited: true, retryAfter };
  }

  recent.push(now);
  memoryBuckets.set(key, recent);

  // периодическая очистка мёртвых ключей
  if (Math.random() < 0.01) {
    for (const [k, times] of memoryBuckets) {
      if (times.every((t) => now - t > MEMORY_PRUNE_MS)) {
        memoryBuckets.delete(k);
      }
    }
  }

  return { limited: false, retryAfter: 0 };
}

export interface RateLimitResult {
  limited: boolean;
  /** Секунды до сброса лимита (для Retry-After) */
  retryAfter: number;
}

const WINDOW_MS = 60_000;

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

  const identifier = ip || "unknown";

  const key =
    pathname.startsWith("/api/auth/")
      ? "auth"
      : pathname.startsWith("/api/admin/")
        ? "admin"
        : "api";

  const limit =
    key === "auth" ? 10 : key === "admin" ? 60 : 30;

  // Upstash подключён — используем его
  const limiter =
    key === "auth"
      ? authLimiter
      : key === "admin"
        ? adminLimiter
        : apiLimiter;

  if (limiter) {
    const { success, reset } = await limiter.limit(identifier);
    const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    return { limited: !success, retryAfter };
  }

  // Fallback: in-memory (single-process VPS / локальная разработка)
  return memoryLimit(`${key}|${identifier}`, limit, WINDOW_MS);
}
