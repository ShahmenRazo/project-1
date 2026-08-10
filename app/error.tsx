"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Глобальный Error Boundary (app/error.tsx).
 * Показывается при краше страницы. «Сообщить о проблеме» отправляет
 * стек ошибки в /api/report-error (в таблицу error_reports).
 */
export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);

  useEffect(() => {
    // ошибка уже залогирована Next.js'ом в консоль
  }, [error]);

  async function handleReport() {
    setReporting(true);
    try {
      await fetch("/api/report-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: error?.message ?? "Unknown error",
          stack: error?.stack ?? "",
          path: window.location.pathname,
        }),
      });
      setReported(true);
    } catch {
      setReported(true);
    } finally {
      setReporting(false);
    }
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mx-auto w-full max-w-md">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-7 w-7 text-destructive" />
        </div>

        <h1 className="mt-6 text-2xl font-bold tracking-tight">
          Something went wrong
        </h1>
        <p className="mt-2 text-muted-foreground">
          An unexpected error occurred. Reload the page — if the
          problem persists, let us know.
        </p>

        {error?.digest && (
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            Error code: {error.digest}
          </p>
        )}

        <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
          <Button onClick={() => reset()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reload page
          </Button>
          <Button variant="outline" onClick={handleReport} disabled={reporting || reported}>
            <Send className="mr-2 h-4 w-4" />
            {reporting
              ? "Sending…"
              : reported
                ? "Thanks, report sent"
                : "Report a problem"}
          </Button>
        </div>
      </div>
    </div>
  );
}
