import { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { ApiError, fail, ok, parseBody, requireUser } from "@/lib/api";
import { sendInviteEmail } from "@/lib/resend";
import { roundMoney } from "@/lib/utils";

const INVITE_TTL_DAYS = 7;

const inviteByEmailSchema = z.object({
  group_id: z.string().uuid(),
  email: z.string().trim().email(),
  share_percent: z.number().positive().max(100).multipleOf(0.01),
});

function inviteLink(token: string): string {
  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  return `${origin}/invite/${token}`;
}

// POST /api/invites — email-приглашение в существующую группу (только создатель)
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const user = await requireUser(supabase);
    const body = await parseBody(req, inviteByEmailSchema);

    const { data: group } = await supabase
      .from("groups")
      .select("id, name, creator_id, subscription_id")
      .eq("id", body.group_id)
      .maybeSingle();

    if (!group) throw new ApiError(404, "Group not found", "NOT_FOUND");
    if (group.creator_id !== user.id) {
      throw new ApiError(
        403,
        "Only the group creator can invite members",
        "FORBIDDEN"
      );
    }

    const { data: sub } = group.subscription_id
      ? await supabase
          .from("subscriptions")
          .select("name, price, currency")
          .eq("id", group.subscription_id)
          .is("deleted_at", null)
          .maybeSingle()
      : { data: null };

    const { data: memberRows } = await supabase
      .from("group_members")
      .select("share_percent")
      .eq("group_id", group.id);

    const used = (memberRows ?? []).reduce(
      (sum, m) => sum + (m.share_percent ?? 0),
      0
    );
    const remaining = roundMoney(100 - used);

    if (body.share_percent > remaining) {
      throw new ApiError(
        400,
        `Only ${remaining}% of the subscription is free — reduce the share`,
        "SHARE_TOO_LARGE"
      );
    }

    const expiresAt = new Date(
      Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    let token: string;
    const { data: existing } = await supabase
      .from("invites")
      .select("id, token")
      .eq("group_id", group.id)
      .eq("email", body.email)
      .eq("status", "pending")
      .maybeSingle();

    if (existing) {
      token = existing.token;
      const { error: updError } = await supabase
        .from("invites")
        .update({ share_percent: body.share_percent, expires_at: expiresAt })
        .eq("id", existing.id);
      if (updError) throw updError;
    } else {
      token = randomBytes(32).toString("hex");
      const { error: invError } = await supabase.from("invites").insert({
        group_id: group.id,
        email: body.email,
        token,
        share_percent: body.share_percent,
        expires_at: expiresAt,
      });
      if (invError) throw invError;
    }

    const link = inviteLink(token);
    const { sent } = await sendInviteEmail({
      to: body.email,
      groupName: group.name,
      subscriptionName: sub?.name ?? "",
      sharePercent: body.share_percent,
      inviteLink: link,
    });

    return ok(
      { email: body.email, link: sent ? link : "" },
      { status: 201 }
    );
  } catch (error) {
    return fail(error);
  }
}
