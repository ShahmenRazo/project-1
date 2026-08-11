"use client";

import { useEffect, useState } from "react";
import { ErrorFallback } from "@/components/error/ErrorFallback";

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
    } catch {
      // поддержка недоступна — просто молчим
    } finally {
      setReporting(false);
    }
  }

  return (
    <ErrorFallback error={error} reset={reset} onReport={handleReport} />
  );
}
