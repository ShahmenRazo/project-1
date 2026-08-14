/**
 * Общие настройки auth-куки для всех Supabase-клиентов (browser + server +
 * middleware). Единый name обязателен для согласованности; domain держим
 * общим для всех хостов приложения (kitstartai.com и www.kitstartai.com),
 * чтобы сессия не «выкидывала» на /login при переходе между хостами.
 *
 * Домен выводится из NEXT_PUBLIC_SUPABASE_URL автоматически; для localhost/IP-адресов
 * domain не ставится (host-only кука).
 */
export const AUTH_COOKIE_OPTIONS: {
  name: string;
  domain?: string;
} = (() => {
  const source =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  let domain: string | undefined;
  if (source) {
    try {
      const { hostname } = new URL(source);
      const isLocal =
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
      if (!isLocal) domain = `.${hostname}`;
    } catch {
      // некорректный URL — остаёмся на host-only куке
    }
  }
  return { name: "sb-auth-token", domain };
})();