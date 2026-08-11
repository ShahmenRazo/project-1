"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Filter, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin/analytics", label: "Overview", icon: Activity },
  { href: "/admin/analytics/cohorts", label: "Cohorts", icon: TrendingUp },
  { href: "/admin/analytics/funnel", label: "Funnel", icon: Filter },
];

/** Вкладки между разделами аналитики (роут-навигация) */
export function AnalyticsTabs() {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 overflow-x-auto rounded-md bg-muted p-1">
      {TABS.map((tab) => {
        const active =
          tab.href === "/admin/analytics"
            ? pathname === "/admin/analytics"
            : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-sm px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
              active && "bg-background text-foreground shadow-sm"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
