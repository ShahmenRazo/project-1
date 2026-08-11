import Link from "next/link";
import { ArrowRight, BellRing, Calculator, Sparkles, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * SEO-контентные секции (ключевые запросы: "split netflix cost",
 * "subscription manager", "share spotify family", "roommate bill split").
 * Тексты естественные, ключи вписаны в контекст — не спам.
 */
export function SeoSections() {
  return (
    <>
      {/* How to split Netflix cost */}
      <section className="border-t bg-muted/40">
        <div className="mx-auto grid max-w-5xl items-start gap-10 px-4 py-20 lg:grid-cols-2">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Users className="h-4 w-4" />
              Roommates
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              How to Split Netflix Cost with Roommates
            </h2>
            <div className="mt-4 space-y-4 text-muted-foreground">
              <p>
                Netflix raised its prices again, and the old trick of sharing
                one password across four apartments doesn't work anymore. The
                honest way to split Netflix cost is simple: get the Premium
                plan, add your roommates as household members, and split the
                bill evenly. A $15.99 plan divided four ways is about $4.00
                per person per month.
              </p>
              <p>
                The hard part was never the math — it's chasing people for
                money every month. SubSplit automates the whole thing: add
                Netflix, set your shares (50/50, 30/30/40, anything), and we
                remind whoever owes what, right before the billing date. No
                awkward group chats, no "can you venmo me again?" texts.
              </p>
              <p>
                SubSplit works for any shared subscription manager-style
                setup: Disney+, Spotify, ChatGPT, YouTube Premium. If you and
                your roommates use it together, you split it together.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border bg-background p-8">
            <h3 className="text-lg font-semibold">
              The monthly math, done for you
            </h3>
            <ul className="mt-5 space-y-4 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <Calculator className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                Fair share split down to the penny — no rounding fights
              </li>
              <li className="flex gap-3">
                <BellRing className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                Automatic roommate bill split reminders before each billing
                date
              </li>
              <li className="flex gap-3">
                <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                Friends pay you back on Venmo, Cash App or Zelle — we just
                track who owes what
              </li>
            </ul>
            <Button asChild className="mt-8 w-full">
              <Link href="/login">
                Split your first bill
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Subscription manager */}
      <section className="border-t">
        <div className="mx-auto max-w-5xl px-4 py-20">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              Shared accounts
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              The Best Subscription Manager for Shared Accounts
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Most subscription trackers only remind you about your own bills.
              But the subscriptions that hurt the most are the shared ones —
              the family Spotify plan, the group Disney+ bundle, the ChatGPT
              Plus you promised to "split sometime". SubSplit is the only
              shared subscription manager built around groups, not just
              reminders.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              {
                title: "One dashboard, all shared bills",
                text: "See every subscription you share, who owes you money, and who owes you a thank-you.",
              },
              {
                title: "Shares that fit your group",
                text: "Split 50/50, 30/30/40, or let everyone pay exactly what they use. Any combination works.",
              },
              {
                title: "Reminders that actually work",
                text: "Friendly nudges before billing day, then progressively funnier ones. Nobody forgets twice.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border bg-card p-6"
              >
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stop overpaying */}
      <section className="border-t bg-muted/40">
        <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-20 lg:grid-cols-2">
          <div className="order-2 rounded-2xl border bg-background p-8 lg:order-1">
            <h3 className="text-lg font-semibold">
              A typical group of 4 saves $360+/year
            </h3>
            <div className="mt-6 space-y-3 text-sm">
              {[
                ["Netflix Premium", "$15.99", "$4.00"],
                ["Spotify Family", "$19.99", "$5.00"],
                ["Disney+ / Hulu", "$10.99", "$2.75"],
                ["ChatGPT Plus", "$20.00", "$5.00"],
              ].map(([name, alone, each]) => (
                <div
                  key={name}
                  className="flex items-center justify-between rounded-lg border px-4 py-3"
                >
                  <span className="font-medium">{name}</span>
                  <span className="flex items-center gap-3 text-muted-foreground">
                    <span className="line-through">{alone}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                    <span className="font-semibold text-primary">{each}</span>
                    <span className="text-xs text-muted-foreground">
                      each
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Wallet className="h-4 w-4" />
              Save money
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Stop Overpaying for Spotify, ChatGPT &amp; Disney+
            </h2>
            <div className="mt-4 space-y-4 text-muted-foreground">
              <p>
                You probably pay full price for services you share anyway.
                Spotify Family is cheaper per person than three individual
                Premium accounts. A Disney+ bundle split with one friend costs
                less than a coffee. The problem was never the subscription
                splitter math — it was keeping track of who paid last month.
              </p>
              <p>
                SubSplit makes sharing feel like the default. Add your
                subscriptions, create a group, and the app works out each
                person's fair share, sends payment reminders, and keeps a
                running history so nobody pays twice or forgets entirely.
              </p>
              <p>
                You keep your own accounts and passwords — we never touch
                them. SubSplit just handles the money side, so "can we share
                Spotify?" goes from awkward to automatic.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Splitwise for subscriptions */}
      <section className="border-t">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary">
            <Users className="h-4 w-4" />
            Automatic
          </div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            Splitwise for Subscriptions — But Automatic
          </h2>
          <p className="mt-4 text-muted-foreground">
            Splitwise is great at splitting one dinner. SubSplit is built for
            the bills that come back every single month. Set it up once, and
            every billing cycle the subscription splitter recalculates, sends
            reminders, and updates the ledger — so your group stays settled
            with zero effort. Think of it as a roommate bill split for
            digital life: set once, split forever.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/login">
              Try SubSplit Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
