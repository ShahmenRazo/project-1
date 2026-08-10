import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  ApiError,
  fail,
  ok,
  parseBody,
  requireUuid,
  requireUser,
} from "@/lib/api";
import { subscriptionUpdateSchema } from "@/lib/schemas";

// PUT /api/subscriptions/[id] — обновить подписку
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireUuid(params.id, "subscription id");
    const supabase = createClient();
    const user = await requireUser(supabase);

    const input = await parseBody(request, subscriptionUpdateSchema);
    if (Object.keys(input).length === 0) {
      throw new ApiError(400, "No fields to update", "EMPTY_UPDATE");
    }

    // Проверка владения (RLS и так ограничит, но для честного 404 — явный запрос)
    const { data: existing, error: findError } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (findError) throw findError;
    if (!existing) {
      throw new ApiError(404, "Subscription not found", "NOT_FOUND");
    }

    const { data: updated, error } = await supabase
      .from("subscriptions")
      .update(input)
      .eq("id", params.id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;

    return ok(updated);
  } catch (error) {
    return fail(error);
  }
}

// DELETE /api/subscriptions/[id] — удалить подписку
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireUuid(params.id, "subscription id");
    const supabase = createClient();
    const user = await requireUser(supabase);

    const { data: existing, error: findError } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (findError) throw findError;
    if (!existing) {
      throw new ApiError(404, "Subscription not found", "NOT_FOUND");
    }

    const { error } = await supabase
      .from("subscriptions")
      .delete()
      .eq("id", params.id)
      .eq("user_id", user.id);

    if (error) throw error;

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return fail(error);
  }
}
