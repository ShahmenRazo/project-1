import withPWAInit from "next-pwa";

// next-pwa v5.6: withPWAInit(options) возвращает плагин (nextConfig) => mergedConfig.
// Кастомный воркер (FCM) кладём в worker/index.js — он компилируется вебпаком
// (target: webworker) с DefinePlugin, поэтому process.env.NEXT_PUBLIC_* подставляются.
const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  customWorkerDir: "worker",
  buildExcludes: [/middleware-manifest\.json$/],
  runtimeCaching: [
    {
      // Статика Next.js: stale-while-revalidate
      urlPattern: /\/_next\/static\/.*/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-assets",
        expiration: {
          maxEntries: 48,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
      },
    },
    {
      // Навигация (страницы дашборда): network-first, офлайн — последний вид
      urlPattern: ({ request }) => request.mode === "navigate",
      handler: "NetworkFirst",
      options: {
        cacheName: "pages",
        networkTimeoutSeconds: 3,
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60,
        },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withPWA(nextConfig);
