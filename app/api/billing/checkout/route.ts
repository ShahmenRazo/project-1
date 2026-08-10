import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ApiError, fail, ok, requireUser } from "@/lib/api";
import { createProCheckout } from "@/lib/billing/lemon";

// POST /api/billing/checkout?period=monthly|yearly — создать checkout LemonSqueezy
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const user = await requireUser(supabase);

    if (!user.email) {
      throw new ApiError(
        400,
      "An email is required to pay (sign in with email or Google)",
        "NO_EMAIL"
      );
    }

    const period = request.nextUrl.searchParams.get("period");
    const checkoutUrl = await createProCheckout({
      userId: user.id,
      email: user.email,
      period: period === "yearly" ? "yearly" : "monthly",
    });

    return ok({ checkout_url: checkoutUrl });
  } catch (error) {
    return fail(error);
  }
}
