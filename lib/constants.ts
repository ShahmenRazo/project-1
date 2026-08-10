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
  streaming: "Стриминг",
  music: "Музыка",
  productivity: "Продуктивность",
  gaming: "Игры",
  vpn: "VPN",
  ai: "AI",
  storage: "Хранилище",
  other: "Другое",
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
