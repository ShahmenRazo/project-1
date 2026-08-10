import type { SubscriptionTier } from "@/lib/database.types";

export interface PlanLimits {
  max_subscriptions: number;
  max_group_members: number;
}

/** Лимиты по тарифам (enforce на сервере + подсказки на клиенте) */
export const LIMITS: Record<SubscriptionTier, PlanLimits> = {
  free: {
    max_subscriptions: 3,
    max_group_members: 2,
  },
  pro: {
    max_subscriptions: Infinity,
    max_group_members: 10,
  },
};

export const FREE_PLAN = {
  id: "free" as const,
  name: "Free",
  price: 0,
  currency: "USD",
  period: null,
  features: [
    "Up to 3 subscriptions",
    "Up to 2 people per group",
    "Manual subscription entry",
    "Basic reminders",
  ],
};

export const PRO_PLAN = {
  id: "pro" as const,
  name: "Pro",
  price: 3.99,
  currency: "USD",
  period: "month",
  features: [
    "Unlimited subscriptions",
    "Up to 10 people per group",
    "Auto-import subscriptions",
    "Meme reminders",
    "Spending stats",
  ],
};
