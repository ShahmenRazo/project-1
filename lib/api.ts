import { NextResponse } from "next/server";
import { ZodError, z, type ZodType } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export type DbClient = SupabaseClient<
  Database,
  "public",
  "public",
  Database["public"]
>;

const uuidSchema = z.string().uuid();

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code: string = "API_ERROR"
  ) {
    super(message);
  }
}

/** Успешный ответ: { data } */
export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ data }, init);
}

/** Единый обработчик ошибок для всех route handlers */
export function fail(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: { message: error.message, code: error.code } },
      { status: error.status }
    );
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          message: "Validation failed",
          code: "VALIDATION_ERROR",
          details: error.flatten(),
        },
      },
      { status: 400 }
    );
  }
  console.error("[api] unhandled error:", error);
  return NextResponse.json(
    { error: { message: "Internal server error", code: "INTERNAL_ERROR" } },
    { status: 500 }
  );
}

/** Парсинг JSON-тела + zod-валидация (возвращает OUTPUT-тип схемы) */
export async function parseBody<T extends ZodType>(
  request: Request,
  schema: T
): Promise<z.output<T>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new ApiError(400, "Invalid JSON body", "INVALID_JSON");
  }
  return schema.parse(raw);
}

/** Проверка авторизации: возвращает пользователя или кидает 401 */
export async function requireUser(supabase: DbClient) {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new ApiError(401, "Unauthorized", "UNAUTHORIZED");
  }
  return data.user;
}

/** Валидация uuid из path params */
export function requireUuid(value: string, label = "id"): void {
  if (!uuidSchema.safeParse(value).success) {
    throw new ApiError(400, `Invalid ${label}`, "INVALID_ID");
  }
}

/** Проверка Postgres-ошибки по коду (например 23505 = unique violation) */
export function isPgError(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === code
  );
}
