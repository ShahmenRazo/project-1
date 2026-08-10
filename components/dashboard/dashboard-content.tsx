"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { GroupsSection } from "@/components/dashboard/groups-section";
import type { DashboardGroup, DashboardSubscription } from "@/lib/types";

export function DashboardContent({
  profile,
}: {
  profile: {
    id: string;
    display_name: string | null;
    email: string;
    subscription_tier: "free" | "pro";
  };
}) {
  const [subscriptions, setSubscriptions] = useState<DashboardSubscription[]>([]);
  const [groups, setGroups] = useState<DashboardGroup[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [subsRes, groupsRes] = await Promise.all([
          fetch("/api/subscriptions"),
          fetch("/api/groups"),
        ]);

        if (!cancelled && subsRes.ok) {
          const json = (await subsRes.json()) as { data?: DashboardSubscription[] };
          if (!cancelled) setSubscriptions(json.data ?? []);
        } else if (!cancelled) {
          toast.error("Не удалось загрузить подписки");
        }

        if (!cancelled && groupsRes.ok) {
          const json = (await groupsRes.json()) as {
            data?: { groups?: DashboardGroup[] };
          };
          if (!cancelled) setGroups(json.data?.groups ?? []);
        } else if (!cancelled) {
          toast.error("Не удалось загрузить группы");
        }
      } catch {
        if (!cancelled) toast.error("Ошибка сети, обновите страницу");
      } finally {
        if (!cancelled) {
          setLoadingSubs(false);
          setLoadingGroups(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-10">
      {loadingSubs ? (
        <div className="space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="h-7 w-52 animate-pulse rounded bg-muted" />
              <div className="h-4 w-72 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-9 w-40 animate-pulse rounded bg-muted" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-28 animate-pulse rounded-xl bg-muted" />
            <div className="h-28 animate-pulse rounded-xl bg-muted" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      ) : (
        <DashboardShell
          subscriptions={subscriptions}
          profile={{
            id: profile.id,
            display_name: profile.display_name,
            email: profile.email,
            subscription_tier: profile.subscription_tier,
          }}
        />
      )}

      {loadingGroups ? (
        <div className="space-y-4">
          <div className="h-6 w-40 animate-pulse rounded bg-muted" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      ) : (
        <GroupsSection groups={groups} />
      )}
    </div>
  );
}
