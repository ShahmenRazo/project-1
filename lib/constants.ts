import type { SubscriptionCategory } from "@/lib/database.types";

export const CATEGORIES: SubscriptionCategory[] = [
  "streaming",
  "music",
  "productivity",
  "gaming",
  "vpn",
  "ai",
  "storage",
  "other",
];

export const CATEGORY_LABELS: Record<SubscriptionCategory, string> = {
  streaming: "Streaming",
  music: "Music",
  productivity: "Productivity",
  gaming: "Gaming",
  vpn: "VPN",
  ai: "AI",
  storage: "Storage",
  other: "Other",
};

export const CURRENCIES = [
  "USD",
  "EUR",
  "RUB",
  "KZT",
  "UAH",
  "GBP",
  "PLN",
  "CZK",
  "TRY",
  "INR",
  "JPY",
] as const;

export const BILLING_DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

/** Версия changelog: показываем toast «What's new» один раз после обновления */
export const CHANGELOG_VERSION = "2026-08-11";

