"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";

const VISITS_KEY = "subsplit_a2hs_visits";
const DISMISSED_KEY = "subsplit_a2hs_dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * PWA-обвязка (client):
 * 1) Регистрирует service worker (кроме localhost — чтобы не кешировать дев).
 * 2) Предлагает «Add to Home Screen» после 2-го визита на мобильном:
 *    - Android/Chrome — через beforeinstallprompt,
 *    - iOS Safari — короткая инструкция.
 */
export function PwaShell() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  useEffect(() => {
    try {
      const visits = Number(localStorage.getItem(VISITS_KEY) ?? "0") + 1;
      localStorage.setItem(VISITS_KEY, String(visits));
      const dismissed = localStorage.getItem(DISMISSED_KEY);
      if (dismissed) return;
      const isMobile =
        window.matchMedia("(pointer: coarse)").matches ||
        window.matchMedia("(max-width: 768px)").matches;
      if (visits >= 2 && isMobile) setShowBanner(true);
    } catch {
      // localStorage недоступен — пропускаем
    }
  }, []);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () =>
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  const dismiss = () => {
    setShowBanner(false);
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // ignore
    }
  };

  const install = async () => {
    if (installEvent) {
      await installEvent.prompt();
      await installEvent.userChoice;
      setInstallEvent(null);
      dismiss();
      return;
    }
    // iOS Safari: инструкция уже в баннере, просто сворачиваем
    dismiss();
  };

  if (!showBanner) return null;

  const isIos = typeof window !== "undefined" &&
    /iphone|ipad|ipod/i.test(window.navigator.userAgent);

  return (
    <div className="fixed inset-x-0 bottom-20 z-40 mx-auto w-[calc(100%-2rem)] max-w-md">
      <div className="rounded-2xl border bg-card p-4 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Plus className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Install SubSplit</p>
              <p className="text-xs text-muted-foreground">
                {installEvent
                  ? "One tap — and it opens like a real app."
                  : "Tap the Share button, then “Add to Home Screen”."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="rounded-lg p-1.5 text-muted-foreground transition hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {installEvent && (
          <button
            type="button"
            onClick={() => void install()}
            className="mt-3 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition active:scale-[0.97]"
          >
            Install now
          </button>
        )}
        {isIos && !installEvent && (
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            Safari: tap the <b>Share</b> icon (square with an arrow), scroll
            down and choose <b>Add to Home Screen</b>.
          </p>
        )}
      </div>
    </div>
  );
}