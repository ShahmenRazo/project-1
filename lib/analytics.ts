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
