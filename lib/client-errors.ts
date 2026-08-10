import { toast } from "sonner";

/** Сообщение об ошибке по HTTP-статусу, с fallback для 4xx */
export function apiErrorMessage(res: Response, fallback: string): string {
  if (res.status === 429) {
    return "Too many requests. Please wait a moment.";
  }
  if (res.status >= 500) {
    return "Something went wrong. Please try again.";
  }
  return fallback;
}

/**
 * Разбирает JSON-ответ API и показывает toast с ошибкой.
 * 429 и 5xx заменяются на человекочитаемые сообщения,
 * остальные — на message из тела (или fallback).
 */
export async function showApiError(res: Response, fallback: string): Promise<string> {
  const message = await apiErrorMessageAsync(res, fallback);
  toast.error(message);
  return message;
}

export async function apiErrorMessageAsync(
  res: Response,
  fallback: string
): Promise<string> {
  if (res.status === 429 || res.status >= 500) {
    return apiErrorMessage(res, fallback);
  }
  try {
    const json = (await res.json()) as { error?: { message?: string } };
    return json?.error?.message ?? fallback;
  } catch {
    return fallback;
  }
}
