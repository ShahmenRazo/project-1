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
});

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withPWA(nextConfig);
