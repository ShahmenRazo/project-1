"use client";

import { useEffect } from "react";
import Script from "next/script";
import { getCookieConsent } from "@/lib/cookie-consent";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

/**
 * Google Analytics 4 с Consent Mode v2 (GDPR).
 * Скрипт gtag подключается всегда, но по умолчанию хранение запрещено
 * (ad_storage/ad_user_data/ad_personalization/analytics_storage = denied).
 * Если пользователь принял cookie-баннер («Accept all») — разрешения
 * обновляются на granted. Без NEXT_PUBLIC_GA_ID компонент рендерит null.
 */
export function GoogleAnalytics() {
  useEffect(() => {
    if (!GA_ID) return;
    const consent = getCookieConsent();
    if (consent?.analytics) {
      const w = window as unknown as { gtag?: (...args: unknown[]) => void };
      w.gtag?.("consent", "update", {
        ad_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted",
        analytics_storage: "granted",
      });
    }
  }, []);

  if (!GA_ID) return null;

  return (
    <>
      <Script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script
        id="gtag-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag() { dataLayer.push(arguments); }
            gtag("consent", "default", {
              ad_storage: "denied",
              ad_user_data: "denied",
              ad_personalization: "denied",
              analytics_storage: "denied",
              wait_for_update: 500
            });
            gtag("js", new Date());
            gtag("config", "${GA_ID}", { anonymize_ip: true });
          `,
        }}
      />
    </>
  );
}
