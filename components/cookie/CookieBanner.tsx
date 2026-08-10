"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getCookieConsent,
  setCookieConsent,
} from "@/lib/cookie-consent";
import { enableAnalytics } from "@/lib/analytics";

/**
 * Баннер согласия на cookies (GDPR/CCPA).
 * Показывается при первом визите; выбор хранится в localStorage.
 * Аналитика подключается только при явном согласии — см. lib/analytics.ts.
 */
export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = getCookieConsent();
    if (!consent) {
      setVisible(true);
      return;
    }
    // Вернувшийся пользователь: подключаем аналитику, если разрешил
    if (consent.analytics) enableAnalytics();
  }, []);

  function handleAcceptAll() {
    setCookieConsent(true);
    enableAnalytics();
    setVisible(false);
  }

  function handleEssentialOnly() {
    setCookieConsent(false);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl rounded-lg border bg-background/95 p-4 shadow-lg backdrop-blur sm:inset-x-6"
    >
      <div className="flex items-start gap-3">
        <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        <div className="flex-1 space-y-3">
          <p className="text-sm text-foreground">
            We use cookies to keep you signed in and, with your permission,
            to understand how the service is used.{" "}
            <Link
              href="/privacy"
              className="font-medium underline underline-offset-4"
            >
              Privacy Policy
            </Link>
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={handleAcceptAll}>
              Accept all
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleEssentialOnly}
            >
              Only necessary
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
