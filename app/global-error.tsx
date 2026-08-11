"use client";

import { ErrorFallback } from "@/components/error/ErrorFallback";

/**
 * Корневой Error Boundary (app/global-error.tsx).
 * Ловит ошибки самого layout; обязан содержать <html> и <body>.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center text-foreground">
        <ErrorFallback error={error} reset={reset} compact />
      </body>
    </html>
  );
}
