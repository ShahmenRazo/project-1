import { NextRequest } from "next/server";
import { ImageResponse } from "@vercel/og";
import { readFileSync } from "fs";
import { join } from "path";
import { createAdminClient } from "@/lib/supabase/admin";
import { roundMoney, shareAmount } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FONT_DIR = join(process.cwd(), "lib/og/fonts");
const inter400 = readFileSync(join(FONT_DIR, "inter-400.ttf"));
const inter700 = readFileSync(join(FONT_DIR, "inter-700.ttf"));
const inter900 = readFileSync(join(FONT_DIR, "inter-900.ttf"));

const EMERALD = "#34d399";
const WHITE = "#fafafa";
const MUTED = "#a1a1aa";

interface OgData {
  group_name: string;
  subscription_name: string | null;
  share_monthly: number;
  currency: string;
  member_count: number;
}

async function loadGroupData(groupId: string): Promise<OgData | null> {
  const admin = createAdminClient();
  const { data: group } = await admin
    .from("groups")
    .select(
      "name, subscriptions(name, price, currency, billing_cycle, billing_day)"
    )
    .eq("id", groupId)
    .maybeSingle();
  if (!group) return null;

  const { count: memberCount } = await admin
    .from("group_members")
    .select("id", { count: "exact", head: true })
    .eq("group_id", groupId);

  const sub = group.subscriptions as
    | {
        name: string;
        price: number;
        currency: string;
        billing_cycle: "monthly" | "yearly";
        billing_day: number;
      }
    | null;

  const { data: memberRows } = await admin
    .from("group_members")
    .select("share_percent")
    .eq("group_id", groupId);
  const used = (memberRows ?? []).reduce(
    (sum, m) => sum + (m.share_percent ?? 0),
    0
  );
  const remaining = roundMoney(100 - used);

  return {
    group_name: group.name,
    subscription_name: sub?.name ?? null,
    share_monthly: sub
      ? roundMoney(
          shareAmount(sub.price, Math.max(0, remaining), sub.billing_cycle)
        )
      : 0,
    currency: sub?.currency ?? "USD",
    member_count: memberCount ?? 0,
  };
}

function fallbackData(): OgData {
  return {
    group_name: "SubSplit",
    subscription_name: null,
    share_monthly: 0,
    currency: "USD",
    member_count: 0,
  };
}

/**
 * GET /api/og?group=[id] — динамическая OG-картинка 1200x630 для шеринга
 * группы в соцсетях. Публичный (используется мета-тегами страниц).
 */
export async function GET(request: NextRequest) {
  const groupId = request.nextUrl.searchParams.get("group") ?? "";
  const data =
    groupId.length === 36
      ? (await loadGroupData(groupId).catch(() => null))
      : null;

  const info = data ?? fallbackData();
  const priceLabel =
    info.share_monthly > 0
      ? `${info.share_monthly.toLocaleString("en-US", {
          style: "currency",
          currency: info.currency,
        })}/mo`
      : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#09090b",
          color: WHITE,
          padding: "72px 84px",
          fontFamily: "Inter",
          position: "relative",
        }}
      >
        {/* фоновый градиент */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(900px 480px at 12% -10%, rgba(52,211,153,0.22), transparent 60%), linear-gradient(180deg, #0d0d10 0%, #09090b 100%)",
          }}
        />

        {/* логотип */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2 4 4.5v5.6c0 4.6 3.3 8.9 8 10.4 4.7-1.5 8-5.8 8-10.4V4.5L12 2Z"
              fill={EMERALD}
            />
            <path
              d="m8.5 11.8 2.4 2.4 4.8-5"
              stroke="#09090b"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span style={{ fontSize: 28, fontWeight: 700, color: WHITE }}>
            SubSplit
          </span>
        </div>

        {/* заголовок */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              display: "flex",
              fontSize: 64,
              fontWeight: 900,
              lineHeight: 1.05,
              maxWidth: 960,
              color: WHITE,
            }}
          >
            {data ? `Join ${info.group_name}` : "Split subscriptions, not friendships"}
          </div>

          {data && (
            <div style={{ display: "flex", alignItems: "center", gap: 24, fontSize: 34 }}>
              <span style={{ color: MUTED }}>
                {info.subscription_name ?? "Shared subscription"}
              </span>
              {priceLabel && (
                <span
                  style={{
                    color: EMERALD,
                    fontWeight: 700,
                    background: "rgba(52,211,153,0.14)",
                    borderRadius: 999,
                    padding: "10px 28px",
                  }}
                >
                  {priceLabel}
                </span>
              )}
            </div>
          )}
        </div>

        {/* футер */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 26,
            color: MUTED,
          }}
        >
          <span>{data ? `${info.member_count} members already inside` : "Automatic share calculation & reminders"}</span>
          <span style={{ fontWeight: 700, color: "#71717a" }}>kitstartai.com</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Inter", data: inter400, weight: 400 },
        { name: "Inter", data: inter700, weight: 700 },
        { name: "Inter", data: inter900, weight: 900 },
      ],
    }
  );
}
