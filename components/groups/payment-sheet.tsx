"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, PiggyBank, X } from "lucide-react";
import { toast } from "sonner";
import { formatMoney } from "@/lib/format";

export interface PayeeHandles {
  user_id: string;
  name: string;
  username: string | null;
  venmo_username: string | null;
  cash_tag: string | null;
  zelle_email: string | null;
}

export interface PaymentSheetProps {
  open: boolean;
  onClose: () => void;
  payee: PayeeHandles | null;
  amount: number;
  currency: string;
  groupId: string;
  groupName: string;
  fromUserId: string;
  onInitiated?: (method: "venmo" | "cash_app" | "zelle") => void;
}

type PayMethod = "venmo" | "cash_app" | "zelle";

function copyText(text: string, label = "Copied to clipboard") {
  void navigator.clipboard.writeText(text).then(
    () => toast.success(label),
    () => toast.error("Could not copy — copy manually")
  );
}

export function PaymentSheet({
  open,
  onClose,
  payee,
  amount,
  currency,
  groupId,
  groupName,
  fromUserId,
  onInitiated,
}: PaymentSheetProps) {
  const [sending, setSending] = useState<PayMethod | null>(null);
  const venmoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Потеря фокуса/скрытие окна = внешний app (Venmo) открылся
  useEffect(() => {
    if (!open) return;
    const onHide = () => {
      if (venmoTimer.current) {
        clearTimeout(venmoTimer.current);
        venmoTimer.current = null;
      }
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("blur", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("blur", onHide);
    };
  }, [open]);

  useEffect(() => {
    if (!open) setSending(null);
  }, [open]);

  useEffect(
    () => () => {
      if (venmoTimer.current) clearTimeout(venmoTimer.current);
    },
    []
  );

  if (!open || !payee) return null;

  const amountText = amount.toFixed(2);
  const summary = `@${payee.username ?? payee.name} $${amountText} for SubSplit: ${groupName}`;

  const track = async (method: PayMethod) => {
    setSending(method);
    try {
      await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_id: groupId,
          to_user_id: payee.user_id,
          amount,
          currency,
          method,
        }),
      });
    } catch {
      // трекинг не критичен — deep link всё равно открываем
    }
    onInitiated?.(method);
  };

  const payVenmo = async () => {
    if (!payee.venmo_username) return;
    await track("venmo");
    const link = `venmo://paycharge?txn=pay&recipients=${encodeURIComponent(
      payee.venmo_username
    )}&amount=${amountText}&note=${encodeURIComponent(`SubSplit: ${groupName}`)}`;

    let appOpened = false;
    const markOpened = () => {
      appOpened = true;
      if (venmoTimer.current) clearTimeout(venmoTimer.current);
    };
    document.addEventListener("visibilitychange", markOpened, { once: true });
    window.addEventListener("blur", markOpened, { once: true });

    window.location.href = link;
    venmoTimer.current = setTimeout(() => {
      if (!appOpened) {
        toast("Venmo not installed. Copy payment details?", {
          action: {
            label: "Copy",
            onClick: () => copyText(summary, "Payment details copied"),
          },
        });
      }
      setSending(null);
    }, 1200);
  };

  const payCashApp = async () => {
    if (!payee.cash_tag) return;
    await track("cash_app");
    window.location.href = `https://cash.app/${payee.cash_tag}/${amountText}`;
    setSending(null);
  };

  const payZelle = async () => {
    if (!payee.zelle_email) return;
    await track("zelle");
    copyText(payee.zelle_email, "Zelle email copied — open your bank app to send");
    setSending(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-[2px] md:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl border bg-background p-5 pb-safe shadow-2xl md:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Pay with"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />

        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">
              Pay {payee.name}
            </p>
            <p className="text-2xl font-bold tabular-nums">
              {formatMoney(amount, currency)}
            </p>
            <p className="text-xs text-muted-foreground">
              for SubSplit group · {groupName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="tap-active rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {payee.venmo_username ? (
            <PayOption
              icon={<span className="text-[#008CFF]">V</span>}
              title="Pay with Venmo"
              subtitle={`@${payee.venmo_username}`}
              loading={sending === "venmo"}
              onClick={() => void payVenmo()}
            />
          ) : null}

          {payee.cash_tag ? (
            <PayOption
              icon={<span className="text-[#00D632]">$</span>}
              title="Pay with Cash App"
              subtitle={`$${payee.cash_tag}`}
              loading={sending === "cash_app"}
              onClick={() => void payCashApp()}
            />
          ) : null}

          {payee.zelle_email ? (
            <PayOption
              icon={<span className="text-[#6D1ED4]">Z</span>}
              title="Pay with Zelle"
              subtitle={payee.zelle_email}
              loading={sending === "zelle"}
              onClick={() => void payZelle()}
            />
          ) : null}

          {!payee.venmo_username && !payee.cash_tag && !payee.zelle_email ? (
            <p className="rounded-xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
              {payee.name} hasn't added payment handles yet — ask them to
              set Venmo, Cash App or Zelle in Profile.
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => copyText(summary, "Payment details copied")}
          className="tap-active mt-4 flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition hover:bg-muted"
        >
          <Copy className="h-4 w-4" />
          Copy payment details
        </button>
      </div>
    </div>
  );
}

function PayOption({
  icon,
  title,
  subtitle,
  loading,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="tap-active flex min-h-12 w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition hover:bg-muted disabled:opacity-60"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-bold">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {subtitle}
        </span>
      </span>
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-foreground/30 border-t-foreground" />
      ) : (
        <PiggyBank className="h-4 w-4 text-muted-foreground" />
      )}
    </button>
  );
}