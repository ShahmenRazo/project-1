import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications";
import { grantProMonth, markReferralConverted } from "@/lib/referrals";
import {
  isProStatus,
  verifyWebhookSignature,
  type LemonWebhookPayload,
} from "@/lib/billing/lemon";
import type { SubscriptionTier } from "@/lib/database.types";

// POST /api/billing/webhook — LemonSqueezy webhook
// События: subscription_created / subscription_updated / subscription_cancelled
//          subscription_resumed / subscription_expired / subscription_paused ...
// Проверка подписи HMAC-SHA256 обязательна.
export async function POST(request: NextRequest) {
  // --- 1. Проверка подписи (иначе любой сможет выдать себе Pro) ---
  const rawBody = await request.text();
  const signature = request.headers.get("X-Signature") ?? "";
  if (!verifyWebhookSignature(rawBody, signature)) {
    console.warn("[billing] webhook rejected: bad signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // --- 2. Разбор payload ---
  let payload: LemonWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as LemonWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = payload.meta?.event_name ?? "";
  // Нас интересуют только события подписки
  if (!event.startsWith("subscription_")) {
    return NextResponse.json({ received: true });
  }

  const data = payload.data;
  const attributes = data?.attributes ?? {};
  const status = attributes.status ?? "unknown";
  const subscriptionId = data?.id;
  const customerId =
    data?.relationships?.customer?.data?.id ?? attributes.customer_id;
  const variantId =
    data?.relationships?.variant?.data?.id ?? attributes.variant_id;
  const isProVariant =
    variantId != null &&
    String(variantId) === (process.env.LEMONSQUEEZY_PRO_VARIANT_ID ?? "");

  // expires_at: активная -> renews_at (след. продление),
  // отменённая -> ends_at (конец оплаченного периода)
  const expiresAt =
    status === "cancelled"
      ? (attributes.ends_at ?? attributes.renews_at)
      : (attributes.renews_at ?? attributes.ends_at);

  const tier: SubscriptionTier =
    isProVariant && isProStatus(status, expiresAt ?? null) ? "pro" : "free";

  // --- 3. Обновление пользователя (admin client обходит RLS) ---
  const admin = createAdminClient();

  // Патч только тех полей, которые есть в payload (идемпотентно)
  const patch: Partial<
    Pick<
      import("@/lib/database.types").Database["public"]["Tables"]["users"]["Row"],
      | "subscription_tier"
      | "plan_status"
      | "ls_subscription_id"
      | "ls_subscription_item_id"
      | "ls_customer_id"
      | "plan_expires_at"
    >
  > = {
    subscription_tier: tier,
    plan_status: status,
  };
  if (subscriptionId) patch.ls_subscription_id = subscriptionId;
  if (attributes.subscription_item_id != null) {
    patch.ls_subscription_item_id = String(attributes.subscription_item_id);
  }
  if (customerId != null) patch.ls_customer_id = String(customerId);
  if (expiresAt) patch.plan_expires_at = expiresAt;

  // --- 4. Поиск пользователя: custom user_id -> ls_subscription_id -> customer ---
  let userId = payload.meta?.custom_data?.user_id ?? null;

  if (!userId && subscriptionId) {
    const { data } = await admin
      .from("users")
      .select("id")
      .eq("ls_subscription_id", subscriptionId)
      .maybeSingle();
    if (data) userId = data.id;
  }
  if (!userId && customerId != null) {
    const { data } = await admin
      .from("users")
      .select("id")
      .eq("ls_customer_id", String(customerId))
      .maybeSingle();
    if (data) userId = data.id;
  }

  if (!userId) {
    console.error("[billing] webhook: no matching user", { event, subscriptionId });
    return NextResponse.json({ received: true, note: "no user matched" });
  }

  const { error } = await admin.from("users").update(patch).eq("id", userId);
  if (error) {
    console.error("[billing] webhook: failed to update user", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  // --- 5. Реферальный бонус: при первой покупке Pro приглашённым
  // оба (он и пригласивший) получают +1 месяц Pro ---
  if (tier === "pro" && event === "subscription_created") {
    const { data: referral } = await admin
      .from("referrals")
      .select("referred_by")
      .eq("user_id", userId)
      .maybeSingle();

    if (referral && (await markReferralConverted(userId))) {
      await grantProMonth(userId); // +1 месяц к LS-подписке
      await grantProMonth(referral.referred_by);
      await createNotification(
        userId,
        "system",
        "Реферальный бонус: +1 месяц Pro за вашу рекомендацию"
      );
      await createNotification(
        referral.referred_by,
        "system",
        "Ваш реферал оформил Pro — вы получили +1 месяц Pro бесплатно"
      );
    }
  }

  // --- 6. Уведомление пользователю ---
  await createNotification(
    userId,
    "system",
    tier === "pro"
      ? `План Pro активирован — все лимиты сняты`
      : `Подписка Pro завершена — вы переведены на тариф Free`
  );

  return NextResponse.json({ received: true, event, tier });
}
