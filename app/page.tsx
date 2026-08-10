import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  BellRing,
  CreditCard,
  Handshake,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SavingsCalculator } from "@/components/landing/savings-calculator";
import { AppPreview } from "@/components/landing/AppPreview";
import { SocialProof } from "@/components/landing/SocialProof";
import { AvailableEverywhere } from "@/components/landing/AvailableEverywhere";
import { TrustBadges } from "@/components/trust/TrustBadges";

export const dynamic = "force-dynamic";

// ---------- Copy (US market) ----------
const COPY = {
  brand: "SubSplit",
  header: {
    howItWorks: "How It Works",
    calculator: "Savings Calculator",
    pricing: "Pricing",
    signIn: "Sign In",
  },
  hero: {
    headlineA: "Split subscriptions, ",
    headlineB: "not friendships",
    subheadline:
      "Netflix, Spotify, ChatGPT, Xbox Game Pass — share the cost automatically. No awkward texts, no forgotten payments.",
    ctaPrimary: "Get Started Free",
    ctaSecondary: "See how much you'll save",
  },
  howItWorks: {
    title: "How It Works",
    subtitle: "Three steps — and you'll never pay full price alone again.",
    stepLabel: (i: number) => `Step ${i + 1}`,
    steps: [
      {
        icon: CreditCard,
        title: "Add your subscription",
        text: "Netflix, Spotify, ChatGPT — add price and billing date in 30 seconds.",
      },
      {
        icon: Users,
        title: "Create a group",
        text: "Invite roommates or friends by email or link. Set shares: 30/30/40.",
      },
      {
        icon: BellRing,
        title: "Get paid back",
        text: "We track who owes what, send reminders, and show the easiest way to settle up.",
      },
    ],
  },
  calculator: {
    badge: "Savings Calculator",
    title: "How much are you paying alone?",
    text: "The average subscription costs $12.99 a month. Five subscriptions is already $780 a year. Split them with roommates, friends, family — and keep most of that money.",
    points: [
      "Fair share math down to the penny",
      "Automatic reminders for what's owed",
      "Monthly and yearly billing cycles",
    ],
  },
  cta: {
    title: "Stop paying for everyone. Split it fairly.",
    text: "Create your first group in two minutes — free, no card required.",
    button: "Start Splitting Free",
  },
} as const;

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="h-5 w-5" />
            {COPY.brand}
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="#how-it-works"
              className="hidden text-muted-foreground hover:text-foreground sm:block"
            >
              {COPY.header.howItWorks}
            </Link>
            <Link
              href="#calculator"
              className="hidden text-muted-foreground hover:text-foreground sm:block"
            >
              {COPY.header.calculator}
            </Link>
            <Link
              href="/pricing"
              className="text-muted-foreground hover:text-foreground"
            >
              {COPY.header.pricing}
            </Link>
            <Button asChild variant="outline" size="sm">
              <Link href="/login">{COPY.header.signIn}</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-primary/5 to-transparent"
        />
        <div className="mx-auto flex max-w-5xl flex-col items-center px-4 pb-16 pt-20 text-center sm:pt-28">
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            {COPY.hero.headlineA}
            <span className="text-primary">{COPY.hero.headlineB}</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            {COPY.hero.subheadline}
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/login">
                {COPY.hero.ctaPrimary}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#calculator">
                {COPY.hero.ctaSecondary}
                <ArrowDown className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>

          {/* Trust badges */}
          <TrustBadges />
        </div>
      </section>

      {/* App preview */}
      <AppPreview />

      {/* How it works */}
      <section id="how-it-works" className="border-t bg-muted/40">
        <div className="mx-auto max-w-5xl px-4 py-20">
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight">
              {COPY.howItWorks.title}
            </h2>
            <p className="mt-3 text-muted-foreground">
              {COPY.howItWorks.subtitle}
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {COPY.howItWorks.steps.map((step, i) => (
              <div
                key={step.title}
                className="rounded-xl border bg-background p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <step.icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-semibold text-muted-foreground">
                    {COPY.howItWorks.stepLabel(i)}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section id="calculator" className="border-t">
        <div className="mx-auto grid max-w-5xl items-center gap-12 px-4 py-20 lg:grid-cols-2">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Wallet className="h-4 w-4" />
              {COPY.calculator.badge}
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              {COPY.calculator.title}
            </h2>
            <p className="mt-4 text-muted-foreground">{COPY.calculator.text}</p>
            <ul className="mt-6 space-y-3 text-sm">
              {COPY.calculator.points.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <SavingsCalculator />
        </div>
      </section>

      {/* Social proof */}
      <SocialProof />

      {/* Available everywhere */}
      <AvailableEverywhere />

      {/* CTA */}
      <section className="border-t bg-primary px-4 py-16 text-primary-foreground">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center">
          <Handshake className="h-10 w-10" />
          <h2 className="max-w-xl text-3xl font-semibold tracking-tight">
            {COPY.cta.title}
          </h2>
          <p className="max-w-md text-primary-foreground/80">{COPY.cta.text}</p>
          <Button asChild size="lg" variant="secondary">
            <Link href="/login">
              {COPY.cta.button}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
