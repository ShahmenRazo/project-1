import { getCookieConsent } from "@/lib/cookie-consent";

let loaded = false;

/**
 * Подключает скрипт аналитики ТОЛЬКО при явном согласии пользователя.
 * Если пользователь выбрал «Только необходимые» или ещё не ответил —
 * скрипты аналитики не загружаются вовсе.
 *
 * Провайдер настраивается через NEXT_PUBLIC_ANALYTICS_SCRIPT_SRC
 * (например, URL скрипта Plausible/Umami). Без него вызов — no-op.
 */
export function enableAnalytics(): void {
  if (typeof window === "undefined" || loaded) return;

  const consent = getCookieConsent();
  if (!consent || !consent.analytics) return;

  // GA4: обновляем Consent Mode v2 — пользователь дал согласие
  const w = window as unknown as { gtag?: (...args: unknown[]) => void };
  w.gtag?.("consent", "update", {
    ad_storage: "granted",
    ad_user_data: "granted",
    ad_personalization: "granted",
    analytics_storage: "granted",
  });

  const src = process.env.NEXT_PUBLIC_ANALYTICS_SCRIPT_SRC;
  if (!src) return;

  loaded = true;
  const script = document.createElement("script");
  script.src = src;
  script.async = true;
  script.defer = true;
  script.dataset.cookieConsent = "analytics";
  document.head.appendChild(script);
}

/**
 * Отправка событий в Google Analytics 4 (gtag).
 * Безопасно вызывать с любой стороны: если GA не подключён (NEXT_PUBLIC_GA_ID
 * не задан) или скрипт ещё не загрузился — вызов молча игнорируется.
 */
export function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean>
): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as { gtag?: (...args: unknown[]) => void };
  if (typeof w.gtag !== "function") return;
  w.gtag("event", name, params);
}
