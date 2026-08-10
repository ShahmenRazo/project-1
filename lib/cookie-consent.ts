export type CookieConsent = {
  /** Суть услуги: без этого сервис не работает (auth-сессия и т.п.) */
  essential: true;
  /** Аналитика — только с явного согласия пользователя */
  analytics: boolean;
  updatedAt: string;
};

const CONSENT_KEY = "subsplit-cookie-consent";

/** Текущее согласие или null, если пользователь ещё не выбрал */
export function getCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsent;
    if (parsed.essential !== true || typeof parsed.analytics !== "boolean") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** Сохранить выбор. analytics=false — аналитика больше не загружается */
export function setCookieConsent(analytics: boolean): CookieConsent {
  const consent: CookieConsent = {
    essential: true,
    analytics,
    updatedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
  } catch {
    // localStorage недоступен (private mode и т.п.) — молча пропускаем
  }
  return consent;
}

export function hasConsented(): boolean {
  return getCookieConsent() !== null;
}
