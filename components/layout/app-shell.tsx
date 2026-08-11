"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CreditCard,
  Gem,
  LayoutDashboard,
  LogOut,
  User,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { createBrowserClientInstance } from "@/lib/supabase/client";
import { CHANGELOG_VERSION } from "@/lib/constants";
import { toast } from "sonner";
import type { SubscriptionTier } from "@/lib/database.types";

export interface AppShellUser {
  display_name: string | null;
  email: string;
  subscription_tier: SubscriptionTier;
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/groups", label: "Groups", icon: Users },
  // Pro ещё не запущен: страница /pricing показывает «Pro is coming soon»
  { href: "/pricing", label: "Pricing", icon: Gem },
  { href: "/profile", label: "Profile", icon: User },
];

export function AppShell({
  user,
  children,
}: {
  user: AppShellUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  // Heartbeat: обновляем last_active при открытии приложения и каждые 5 минут
  useEffect(() => {
    const beat = () => {
      void fetch("/api/heartbeat", { method: "POST" }).catch(() => {});
    };
    beat();
    const timer = setInterval(beat, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  // What's new: toast при первом входе после обновления
  useEffect(() => {
    try {
      const seen = localStorage.getItem("subsplit_changelog_seen");
      if (seen !== CHANGELOG_VERSION) {
        localStorage.setItem("subsplit_changelog_seen", CHANGELOG_VERSION);
        toast.info("SubSplit just got better! Check out the new features.");
      }
    } catch {
      // localStorage недоступен — пропускаем
    }
  }, []);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    const supabase = createBrowserClientInstance();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const initials = (user.display_name ?? user.email)
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <CreditCard className="h-5 w-5" />
            SubSplit
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Badge
              variant={user.subscription_tier === "pro" ? "default" : "secondary"}
              className="hidden sm:inline-flex"
            >
              {user.subscription_tier === "pro" ? "Pro" : "Free"}
            </Badge>
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ring-offset-background transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Account menu"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="truncate text-sm font-medium">
                    {user.display_name ?? user.email}
                  </p>
                  <p className="truncate text-xs font-normal text-muted-foreground">
                    {user.email}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" /> Profile
                  </Link>
                </DropdownMenuItem>
                {/* Pro пока «Coming soon» — страница /pricing ведёт на waitlist */}
                <DropdownMenuItem asChild>
                  <Link href="/pricing">
                    <Gem className="mr-2 h-4 w-4" /> Pricing
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={signingOut}
                  onSelect={(e) => {
                    e.preventDefault();
                    void handleSignOut();
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {signingOut ? "Signing out..." : "Sign out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-52 shrink-0 border-r px-3 py-6 md:block">
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 px-4 pb-24 pt-6 md:pb-8">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4 pb-safe">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "tap-active flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
