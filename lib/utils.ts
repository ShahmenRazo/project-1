import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { BillingCycle } from "@/lib/database.types";

/** Слияние Tailwind-классов (для shadcn/ui) */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Округление денег до 2 знаков */
export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Доля участника от цены подписки (yearly = цена за 12 месяцев) */
export function shareAmount(
  price: number,
  sharePercent: number,
  cycle: BillingCycle
): number {
  const periods = cycle === "monthly" ? 1 : 12;
  return roundMoney((price * sharePercent) / 100 / periods);
}

/** Ближайшая будущая дата списания по billing_day (в UTC, YYYY-MM-DD) */
export function nextBillingDate(
  billingDay: number,
  from: Date = new Date()
): string {
  const day = Math.min(billingDay, 28);
  const now = from;
  let due = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), day)
  );
  if (due.getTime() <= now.getTime()) {
    due = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, day));
  }
  return due.toISOString().slice(0, 10);
}
