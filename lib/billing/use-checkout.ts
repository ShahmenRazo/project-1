"use client";

import { useState } from "react";
import { toast } from "sonner";

/** Хук для запуска checkout LemonSqueezy (используется в Pricing и Upsell) */
export function useCheckout() {
  const [loading, setLoading] = useState(false);

  async function startCheckout(period: "monthly" | "yearly" = "monthly"): Promise<void> {
    setLoading(true);
    try {
      const res = await fetch(`/api/billing/checkout?period=${period}`, {
        method: "POST",
      });
      const json = (await res.json().catch(() => null)) as {
        error?: { message?: string };
        data?: { checkout_url?: string };
      } | null;

      if (!res.ok) {
        toast.error(json?.error?.message ?? "Не удалось создать оформление");
        return;
      }

      const url = json?.data?.checkout_url;
      if (url) {
        window.location.href = url;
      } else {
        toast.error("Не получен URL оформления");
      }
    } catch {
      toast.error("Ошибка сети, попробуйте ещё раз");
    } finally {
      setLoading(false);
    }
  }

  return { loading, startCheckout };
}
