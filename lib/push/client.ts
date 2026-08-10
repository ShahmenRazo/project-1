"use client";

import type { Messaging } from "firebase/messaging";

/**
 * Клиентская обвязка FCM. Firebase SDK грузится динамически,
 * чтобы не раздувать основной бандл.
 *
 * Важно: используем уже зарегистрированный next-pwa service worker
 * (serviceWorkerRegistration), чтобы НЕ регистрировать второй SW,
 * который перекрыл бы sw.js (offline-кеш).
 */

let cachedMessaging: Messaging | null | undefined;

async function getMessagingInstance(): Promise<Messaging | null> {
  if (cachedMessaging !== undefined) return cachedMessaging;

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

  if (!apiKey || !projectId || !messagingSenderId || !appId || !vapidKey) {
    cachedMessaging = null;
    return null;
  }

  const [{ initializeApp, getApps }, { getMessaging }] = await Promise.all([
    import("firebase/app"),
    import("firebase/messaging"),
  ]);

  const app =
    getApps().length > 0
      ? getApps()[0]
      : initializeApp({ apiKey, projectId, messagingSenderId, appId });

  cachedMessaging = getMessaging(app);
  return cachedMessaging;
}

export interface PushRequestResult {
  granted: boolean;
  token: string | null;
}

/** Запрос разрешения + получение FCM-токена + сохранение на сервере */
export async function requestPushPermission(): Promise<PushRequestResult> {
  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    !("serviceWorker" in navigator)
  ) {
    return { granted: false, token: null };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { granted: false, token: null };

  const messaging = await getMessagingInstance();
  if (!messaging) return { granted: false, token: null };

  const { getToken } = await import("firebase/messaging");

  // Используем существующий sw.js (next-pwa + FCM-код из customWorker)
  const registration = await navigator.serviceWorker.ready;
  const token = await getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });

  if (!token) return { granted: false, token: null };

  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, device: "web" }),
  });
  if (!res.ok) return { granted: false, token: null };

  return { granted: true, token };
}

/** Foreground-сообщения: показать toast внутри приложения */
export async function onForegroundMessage(
  callback: (payload: { title?: string; body?: string; url?: string }) => void
): Promise<() => void> {
  const messaging = await getMessagingInstance();
  if (!messaging) return () => {};

  const { onMessage } = await import("firebase/messaging");
  return onMessage(messaging, (payload) => {
    callback({
      title: payload.notification?.title,
      body: payload.notification?.body,
      url: payload.data?.url,
    });
  });
}
