// Кастомный service worker SubSplit (next-pwa "worker/").
// Собирается вебпаком с target: "webworker"; process.env.NEXT_PUBLIC_* заменяются
// DefinePlugin'ом при сборке (брать их из import.meta.env нельзя в этом контексте).

importScripts(
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js"
);

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  const app = self.firebase.initializeApp(firebaseConfig);
  const messaging = self.firebase.messaging(app);

  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title ?? "SubSplit";
    const body = payload.notification?.body ?? "";
    const url = payload.data?.url ?? "/";

    self.registration.showNotification(title, {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url },
      tag: `subsplit-${Date.now()}`,
    });
  });
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url ?? "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
