"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { apiErrorMessageAsync } from "@/lib/client-errors";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { GroupsSection } from "@/components/dashboard/groups-section";
import {
  DashboardSkeleton,
  GroupListSkeleton,
} from "@/components/ui/skeleton";
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
          toast.error(await apiErrorMessageAsync(subsRes, "Failed to load subscriptions"));
        }

        if (!cancelled && groupsRes.ok) {
          const json = (await groupsRes.json()) as {
            data?: { groups?: DashboardGroup[] };
          };
          if (!cancelled) setGroups(json.data?.groups ?? []);
        } else if (!cancelled) {
          toast.error(await apiErrorMessageAsync(groupsRes, "Failed to load groups"));
        }
      } catch {
        if (!cancelled) toast.error("Network error, please refresh the page");
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
        <DashboardSkeleton />
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
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-2">
              <div className="h-6 w-40 animate-pulse rounded bg-muted" />
              <div className="h-4 w-56 animate-pulse rounded bg-muted" />
            </div>
          </div>
          <GroupListSkeleton />
        </div>
      ) : (
        <GroupsSection groups={groups} />
      )}
    </div>
  );
}
