import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, adminErrorResponse } from "@/lib/admin/guard";

const PRO_PRICE_USD = 3.99;

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    const sinceWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const [usersRes, subsRes, gmRes] = await Promise.all([
      admin.from("users").select("id, subscription_tier, plan_status, created_at, last_active, country"),
      admin.from("subscriptions").select("name").is("deleted_at", null),
      admin.from("group_members").select("user_id"),
    ]);

    if (usersRes.error) throw usersRes.error;
    if (subsRes.error) throw subsRes.error;
    if (gmRes.error) throw gmRes.error;

    const users = usersRes.data;
    const totalUsers = users.length;
    const activeToday = users.filter(
      (u) => u.last_active && new Date(u.last_active) >= todayStart
    ).length;
    const newThisWeek = users.filter((u) => new Date(u.created_at) >= new Date(sinceWeek)).length;
    const proUsers = users.filter((u) => u.subscription_tier === "pro").length;
    const activePro = users.filter((u) => u.plan_status === "active").length;
    const mrr = Math.round(activePro * PRO_PRICE_USD * 100) / 100;

    // Рост: последние 14 дней
    const growthMap = new Map<string, number>();
    const days: { date: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      growthMap.set(key, 0);
    }
    for (const u of users) {
      const key = new Date(u.created_at).toISOString().slice(0, 10);
      if (growthMap.has(key)) growthMap.set(key, (growthMap.get(key) ?? 0) + 1);
    }
    for (const [date, count] of growthMap) days.push({ date, count });

    // Топ-5 подписок
    const subCounts = new Map<string, number>();
    for (const s of subsRes.data) {
      subCounts.set(s.name, (subCounts.get(s.name) ?? 0) + 1);
    }
    const topSubscriptions = [...subCounts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Топ-5 стран
    const countryCounts = new Map<string, number>();
    for (const u of users) {
      const c = u.country ?? "Unknown";
      countryCounts.set(c, (countryCounts.get(c) ?? 0) + 1);
    }
    const topCountries = [...countryCounts.entries()]
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return Response.json({
      data: {
        total_users: totalUsers,
        active_today: activeToday,
        new_this_week: newThisWeek,
        pro_users: proUsers,
        mrr,
        growth: days,
        top_subscriptions: topSubscriptions,
        top_countries: topCountries,
      },
    });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
