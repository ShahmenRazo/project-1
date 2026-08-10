import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ApiError, fail, ok, requireUser } from "@/lib/api";
import { createProCheckout } from "@/lib/billing/lemon";

// POST /api/billing/checkout — создать checkout LemonSqueezy на план Pro
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const user = await requireUser(supabase);

    if (!user.email) {
      throw new ApiError(
        400,
      "Для оплаты нужен email (войдите через email или Google)",
        "NO_EMAIL"
      );
    }

    const checkoutUrl = await createProCheckout({
      userId: user.id,
      email: user.email,
    });

    return ok({ checkout_url: checkoutUrl });
  } catch (error) {
    return fail(error);
  }
}
