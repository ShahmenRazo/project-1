"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { GroupsSection } from "@/components/dashboard/groups-section";
import type { DashboardGroup } from "@/lib/types";

export function GroupsPageContent() {
  const [groups, setGroups] = useState<DashboardGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/groups");
        if (!cancelled && res.ok) {
          const json = (await res.json()) as {
            data?: { groups?: DashboardGroup[] };
          };
          if (!cancelled) setGroups(json.data?.groups ?? []);
        } else if (!cancelled) {
          toast.error("Не удалось загрузить группы");
        }
      } catch {
        if (!cancelled) toast.error("Ошибка сети, обновите страницу");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return <GroupsSection groups={groups} loading={loading} />;
}
