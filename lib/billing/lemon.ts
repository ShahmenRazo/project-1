import { createHmac, timingSafeEqual } from "node:crypto";
import { ApiError } from "@/lib/api";

const LEMONSQUEEZY_API = "https://api.lemonsqueezy.com/v1";

// ---------------------------------------------------------------------------
// Типы payload'ов вебхуков LemonSqueezy
// ---------------------------------------------------------------------------

export interface LemonWebhookPayload {
  meta?: {
    event_name: string;
    custom_data?: {
      user_id?: string;
      [key: string]: unknown;
    };
  };
  data?: {
    id: string;
    type: string;
    attributes: {
      status?: string;
      ends_at?: string | null;
      renews_at?: string | null;
      customer_id?: string | number;
      variant_id?: string | number;
      subscription_item_id?: string | number;
      first_subscription_item?: { id?: string | number };
      [key: string]: unknown;
    };
    relationships?: {
      customer?: { data?: { id: string | number } };
      variant?: { data?: { id: string | number } };
      [key: string]: unknown;
    };
  };
}

/** Статусы LS, при которых Pro считается активным */
const ACTIVE_STATUSES = new Set(["active", "on_trial", "past_due"]);

// ---------------------------------------------------------------------------
// Checkout
// ---------------------------------------------------------------------------

/** Создаёт hosted checkout на план Pro и возвращает URL */
export async function createProCheckout(input: {
  userId: string;
  email: string;
}): Promise<string> {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const variantId = process.env.LEMONSQUEEZY_PRO_VARIANT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!apiKey || !storeId || !variantId) {
    throw new ApiError(
      500,
      "Billing is not configured on the server",
      "BILLING_NOT_CONFIGURED"
    );
  }

  const res = await fetch(`${LEMONSQUEEZY_API}/checkouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email: input.email,
            // user_id вернётся в вебхуке в meta.custom_data.user_id
            custom: { user_id: input.userId },
          },
          product_options: {
            redirect_url: `${appUrl}/pricing?status=success`,
          },
          checkout_options: {
            dark: false,
          },
        },
        relationships: {
          store: { data: { type: "stores", id: storeId } },
          variant: { data: { type: "variants", id: variantId } },
        },
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[billing] checkout failed:", res.status, body);
    throw new ApiError(
      502,
      "LemonSqueezy checkout creation failed",
      "LEMONSQUEEZY_ERROR"
    );
  }

  const json = (await res.json()) as {
    data?: { attributes?: { url?: string } };
  };
  const url = json?.data?.attributes?.url;
  if (!url) {
    throw new ApiError(
      502,
      "LemonSqueezy returned no checkout URL",
      "LEMONSQUEEZY_ERROR"
    );
  }

  return url;
}

// ---------------------------------------------------------------------------
// Webhook
// ---------------------------------------------------------------------------

/**
 * Проверка подписи вебхука LemonSqueezy:
 * X-Signature = hex(HMAC-SHA256(webhook_secret, raw_body))
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[billing] LEMONSQUEEZY_WEBHOOK_SECRET is not set");
    return false;
  }
  const expected = createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Статусы Pro (активный или в grace-периоде после отмены) */
export function isProStatus(status: string, expiresAt: string | null): boolean {
  if (ACTIVE_STATUSES.has(status)) return true;
  // cancelled/paused/expired: доступ сохраняется до конца оплаченного периода
  return (
    expiresAt !== null &&
    expiresAt !== "" &&
    new Date(expiresAt).getTime() > Date.now()
  );
}
