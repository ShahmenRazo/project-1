"use client";

import { AlertTriangle, LifeBuoy, RefreshCw, Send } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const SUPPORT_URL = "mailto:support@kitstartai.com";

/**
 * Красивая карточка ошибки: «Something went wrong» + reload + поддержка.
 * Используется в app/error.tsx и app/global-error.tsx.
 * onReport — опционально (отправка стека ошибки в поддержку).
 */
export function ErrorFallback({
  error,
  reset,
  onReport,
  supportUrl = SUPPORT_URL,
  compact = false,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  onReport?: () => Promise<void>;
  supportUrl?: string;
  compact?: boolean;
}) {
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);

  async function handleReport() {
    if (!onReport) return;
    setReporting(true);
    try {
      await onReport();
      setReported(true);
    } catch {
      setReported(true);
    } finally {
      setReporting(false);
    }
  }

  return (
    <div
      className={`flex w-full flex-col items-center justify-center px-4 py-16 text-center ${
        compact ? "min-h-[50vh]" : "min-h-[60vh]"
      }`}
    >
      <div className="mx-auto w-full max-w-md">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-7 w-7 text-destructive" />
        </div>

        <h1 className="mt-6 text-2xl font-bold tracking-tight">
          Something went wrong
        </h1>
        <p className="mt-2 text-muted-foreground">
          An unexpected error occurred. Reload the page — if the problem
          persists, contact support.
        </p>

        {error?.digest && (
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            Error code: {error.digest}
          </p>
        )}

        <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
          <Button onClick={() => reset()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reload
          </Button>
          <Button asChild variant="outline">
            <a href={supportUrl} target="_blank" rel="noopener noreferrer">
              <LifeBuoy className="mr-2 h-4 w-4" />
              Contact support
            </a>
          </Button>
          {onReport && (
            <Button
              variant="outline"
              onClick={handleReport}
              disabled={reporting || reported}
            >
              <Send className="mr-2 h-4 w-4" />
              {reporting
                ? "Sending…"
                : reported
                  ? "Thanks, report sent"
                  : "Report a problem"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
