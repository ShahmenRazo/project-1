import { NextRequest } from "next/server";
import { ImageResponse } from "@vercel/og";
import { createAdminClient } from "@/lib/supabase/admin";
import { roundMoney, shareAmount } from "@/lib/utils";

// Edge Runtime: шрифты подгружаются как ассеты (readFileSync на edge недоступен)
export const runtime = "edge";

const inter400 = fetch(
  new URL("../../../lib/og/fonts/inter-400.ttf", import.meta.url)
).then((res) => res.arrayBuffer());
const inter700 = fetch(
  new URL("../../../lib/og/fonts/inter-700.ttf", import.meta.url)
).then((res) => res.arrayBuffer());
const inter900 = fetch(
  new URL("../../../lib/og/fonts/inter-900.ttf", import.meta.url)
).then((res) => res.arrayBuffer());

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

function BrandCard({ title, fonts }: { title: string; fonts: { name: string; data: ArrayBuffer; weight: 400 | 700 | 900 }[] }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(180deg, #18181b 0%, #27272a 100%)",
          color: WHITE,
          fontFamily: "Inter",
          position: "relative",
        }}
      >
        {/* круг с $ */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 96,
            height: 96,
            borderRadius: 999,
            background: EMERALD,
            color: "#09090b",
            fontSize: 56,
            fontWeight: 900,
          }}
        >
          $
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 96,
            fontWeight: 900,
            lineHeight: 1.1,
            marginTop: 36,
            color: WHITE,
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 40,
            color: MUTED,
            marginTop: 16,
          }}
        >
          Split subscriptions, not friendships
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts,
    }
  );
}

function GroupCard({ data, fonts }: { data: OgData; fonts: { name: string; data: ArrayBuffer; weight: 400 | 700 | 900 }[] }) {
  const priceLabel =
    data.share_monthly > 0
      ? `${data.share_monthly.toLocaleString("en-US", {
          style: "currency",
          currency: data.currency,
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
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 12% -10%, rgba(52,211,153,0.22), transparent 60%), linear-gradient(180deg, #0d0d10 0%, #09090b 100%)",
          }}
        />

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
            Join {data.group_name}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 24, fontSize: 34 }}>
            <span style={{ color: MUTED }}>
              {data.subscription_name ?? "Shared subscription"}
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
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 26,
            color: MUTED,
          }}
        >
          <span>{`${data.member_count} members already inside`}</span>
          <span style={{ fontWeight: 700, color: "#71717a" }}>kitstartai.com</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts,
    }
  );
}

/**
 * GET /api/og?title=SubSplit — брендовая OG-картинка 1200x630 для лендинга.
 * GET /api/og?group=[id] — динамическая OG-картинка группы (шеринг в соцсетях).
 * Публичный (используется мета-тегами страниц).
 */
export async function GET(request: NextRequest) {
  const groupId = request.nextUrl.searchParams.get("group") ?? "";
  const title = request.nextUrl.searchParams.get("title") ?? "SubSplit";

  const fonts = [
    { name: "Inter", data: await inter400, weight: 400 as const },
    { name: "Inter", data: await inter700, weight: 700 as const },
    { name: "Inter", data: await inter900, weight: 900 as const },
  ];

  const data =
    groupId.length === 36
      ? await loadGroupData(groupId).catch(() => null)
      : null;

  if (data) {
    return GroupCard({ data, fonts });
  }
  return BrandCard({ title, fonts });
}
