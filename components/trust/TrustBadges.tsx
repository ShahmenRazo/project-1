import { CheckCircle2 } from "lucide-react";

const BADGES = [
  { icon: "🔒", label: "SSL Secure" },
  { icon: "💳", label: "No credit card to start" },
  { icon: "⚡", label: "Setup in 2 min" },
  { icon: "🌍", label: "Used in 15+ countries" },
] as const;

/** Блок доверия под hero: краткие гарантии для нового посетителя */
export function TrustBadges() {
  return (
    <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
      {BADGES.map((badge) => (
        <li key={badge.label} className="flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span aria-hidden className="mr-0.5 text-base leading-none">
            {badge.icon}
          </span>
          {badge.label}
        </li>
      ))}
    </ul>
  );
}
