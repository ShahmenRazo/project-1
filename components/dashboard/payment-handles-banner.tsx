import Link from "next/link";
import { PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Смарт-промпт: у пользователя не заполнены платёжные реквизиты —
 * друзья не смогут легко оплатить долги.
 */
export function PaymentHandlesBanner({ displayName }: { displayName: string | null }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-3">
      <div className="flex items-start gap-3">
        <PiggyBank className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="text-sm">
          <p className="font-medium">
            {displayName ? `${displayName}, add your payment details` : "Add your payment details"}
          </p>
          <p className="text-muted-foreground">
            Venmo, Cash App or Zelle — so group members can pay you instantly.
          </p>
        </div>
      </div>
      <Button asChild variant="outline" size="sm">
        <Link href="/profile">Add now</Link>
      </Button>
    </div>
  );
}
