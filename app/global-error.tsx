"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

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
    <html lang="ru">
      <body className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center text-foreground">
        <div className="mx-auto w-full max-w-md">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>

          <h1 className="mt-6 text-2xl font-bold tracking-tight">
            Критическая ошибка
          </h1>
          <p className="mt-2 text-muted-foreground">
            Не удалось загрузить приложение. Перезагрузите страницу или
            зайдите позже.
          </p>

          {error?.digest && (
            <p className="mt-2 font-mono text-xs text-muted-foreground">
              Код ошибки: {error.digest}
            </p>
          )}

          <button
            onClick={() => reset()}
            className="mt-8 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Перезагрузить страницу
          </button>
        </div>
      </body>
    </html>
  );
}
