import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Admin client (service role) — ОБХОДИТ RLS.
 * Используется ТОЛЬКО server-side и ТОЛЬКО для кросс-пользовательских операций:
 *  - поиск пользователя по email (приглашение в группу)
 *  - создание уведомлений другим пользователям
 * Никогда не передавать этот клиент в клиентский код.
 *
 * global.fetch оборачивается с cache: "no-store": без этого Next.js кеширует
 * GET-запросы PostgREST в on-disk fetch-cache (в route handlers кеш не
 * применяется, поэтому расхождение «страница видит старое, API — свежее»).
 */
export function createAdminClient() {
  const url = process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY (server misconfigured)");
  }

  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) =>
        fetch(input, { ...init, cache: "no-store" }),
    },
  });
}
