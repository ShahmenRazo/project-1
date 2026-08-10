"use client";

import { Check, Crown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PRO_PLAN } from "@/lib/billing/plans";
import { useCheckout } from "@/lib/billing/use-checkout";
import { formatMoney } from "@/lib/format";

/**
 * Upsell-модалка: показывается free-пользователю, когда он
 * упирается в лимит тарифа (4-я подписка, 3-й человек в группе и т.д.).
 */
export function UpsellModal({
  trigger,
  feature,
}: {
  trigger?: React.ReactNode;
  feature?: string;
}) {
  const { loading, startCheckout } = useCheckout();

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="outline">Добавить подписку</Button>}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-left">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Crown className="h-5 w-5 text-primary" />
          </div>
          <DialogTitle>Переходите на Pro</DialogTitle>
          <DialogDescription>
            {feature
              ? `Возможность «${feature}» доступна только на плане Pro.`
              : "Вы достигли лимита бесплатного тарифа."}
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2 rounded-lg border bg-muted/30 p-4">
          {PRO_PLAN.features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 shrink-0 text-primary" />
              {f}
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-2">
          <Button
            onClick={() => startCheckout()}
            disabled={loading}
            className="w-full"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Перейти на Pro —{" "}
            {formatMoney(PRO_PLAN.price, PRO_PLAN.currency)}/мес
          </Button>
          <DialogClose asChild>
            <Button variant="ghost" className="w-full" disabled={loading}>
              Остаться на Free
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
