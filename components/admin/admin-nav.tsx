"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CreditCard, Users, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: BarChart3, exact: true },
  { href: "/admin/users", label: "Users", icon: Users, exact: false },
  { href: "/admin/groups", label: "Groups", icon: UsersRound, exact: false },
  { href: "/admin/payments", label: "Payments", icon: CreditCard, exact: false },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
              active && "bg-background shadow-sm"
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

/** Горизонтальная навигация для мобильных (вместо сайдбара) */
export function AdminNavMobile() {
  const pathname = usePathname();

  return (
    <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
      {NAV.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
              active && "bg-primary text-primary-foreground"
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
