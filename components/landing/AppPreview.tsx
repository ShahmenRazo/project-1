import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Check,
  Clock,
  Film,
  Music,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const SCREENSHOTS = [
  {
    caption: "Your subscriptions",
    text: "All your subscriptions and who owes what — in one dashboard.",
    view: "dashboard",
  },
  {
    caption: "Split with friends",
    text: "Groups with fair shares. Everyone sees their part down to the penny.",
    view: "group",
  },
  {
    caption: "Get reminded",
    text: "Automatic reminders (with memes) so nobody has to ask twice.",
    view: "notifications",
  },
] as const;

const SUBS = [
  { name: "Netflix", price: "$15.99", icon: Film, color: "bg-red-500", share: "Your share $5.33" },
  { name: "Spotify", price: "$10.99", icon: Music, color: "bg-green-500", share: "Your share $3.66" },
  { name: "ChatGPT", price: "$20.00", icon: Sparkles, color: "bg-teal-500", share: "Your share $6.67" },
] as const;

const MEMBERS = [
  { initials: "VA", name: "Vanya", share: "25%" },
  { initials: "MA", name: "Masha", share: "25%" },
  { initials: "DI", name: "Dima", share: "25%" },
  { initials: "LE", name: "Lena", share: "25%" },
] as const;

const STATUSES = [
  { name: "Vanya", text: "paid ✓", paid: true },
  { name: "Masha", text: "pending", paid: false },
] as const;

function WindowFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-background shadow-lg">
      <div className="flex items-center gap-1.5 border-b bg-muted/40 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
        <span className="ml-3 truncate rounded-md bg-background px-2 py-0.5 text-[11px] text-muted-foreground">
          {children}
        </span>
      </div>
    </div>
  );
}

function DashboardShot() {
  return (
    <div className="space-y-2.5 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Your subscriptions</p>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
          3 active
        </span>
      </div>
      {SUBS.map((sub) => (
        <div
          key={sub.name}
          className="flex items-center gap-3 rounded-lg border bg-background p-2.5"
        >
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${sub.color} text-white`}
          >
            <sub.icon className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{sub.name}</p>
            <p className="text-[11px] text-muted-foreground">{sub.share}</p>
          </div>
          <span className="text-sm font-semibold">{sub.price}</span>
        </div>
      ))}
      <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-[11px] text-muted-foreground">
        <span>Total: $46.99</span>
        <span className="font-medium text-foreground">Your share: $15.66</span>
      </div>
    </div>
  );
}

function GroupShot() {
  return (
    <div className="space-y-3 p-4">
      <div>
        <p className="text-sm font-semibold">The Apartment</p>
        <p className="text-[11px] text-muted-foreground">4 members · Netflix</p>
      </div>
      <div className="flex items-center justify-between">
        {MEMBERS.map((m) => (
          <div key={m.initials} className="flex flex-col items-center gap-1">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary">
                {m.initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-[10px] text-muted-foreground">{m.share}</span>
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        {STATUSES.map((s) => (
          <div
            key={s.name}
            className="flex items-center justify-between rounded-lg border px-3 py-1.5 text-[11px]"
          >
            <span className="font-medium">{s.name}</span>
            <span
              className={
                s.paid
                  ? "flex items-center gap-1 text-emerald-600"
                  : "flex items-center gap-1 text-amber-500"
              }
            >
              {s.paid ? (
                <Check className="h-3 w-3" />
              ) : (
                <Clock className="h-3 w-3" />
              )}
              {s.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotificationsShot() {
  return (
    <div className="space-y-2.5 p-4">
      <p className="text-sm font-semibold">Reminders</p>
      <div className="flex gap-2.5 rounded-lg border bg-background p-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <Check className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[11px] font-medium">
            Vanya sent you <span className="font-semibold">$4.50</span> for
            Netflix
          </p>
          <p className="text-[10px] text-muted-foreground">2 min ago</p>
        </div>
      </div>
      <div className="flex gap-2.5 rounded-lg border bg-background p-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Bell className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[11px] font-medium">
            Meme reminder sent to Masha
          </p>
          <p className="text-[10px] text-muted-foreground">
            "Your roommates miss your $3.30 🍕"
          </p>
        </div>
      </div>
    </div>
  );
}

const VIEWS: Record<string, () => React.ReactNode> = {
  dashboard: DashboardShot,
  group: GroupShot,
  notifications: NotificationsShot,
};

/** Секция "See SubSplit in action": мокапы интерфейса продукта */
export function AppPreview() {
  return (
    <section className="border-t">
      <div className="mx-auto max-w-5xl px-4 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            See SubSplit in action
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            No screenshots from a pitch deck — this is literally the app. Built
            for real groups with real payments.
          </p>
        </div>

        <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-6">
          {SCREENSHOTS.map((shot) => {
            const View = VIEWS[shot.view];
            return (
              <figure key={shot.view} className="flex flex-col">
                <WindowFrame>{shot.caption}</WindowFrame>
                <div className="rounded-xl border bg-background shadow-lg">
                  <View />
                </div>
                <figcaption className="mt-4">
                  <p className="text-sm font-semibold">{shot.caption}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {shot.text}
                  </p>
                </figcaption>
              </figure>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Button asChild size="lg">
            <Link href="/login">
              Try it yourself — free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
