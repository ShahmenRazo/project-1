import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  CreditCard,
  Handshake,
  BellRing,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SavingsCounter } from "@/components/landing/savings-counter";
import { SavingsCalculator } from "@/components/landing/savings-calculator";

export const dynamic = "force-dynamic";

const STEPS = [
  {
    icon: CreditCard,
    title: "Добавьте подписку",
    text: "Netflix, Spotify, ChatGPT — укажите цену и день списания за 30 секунд.",
  },
  {
    icon: Users,
    title: "Создайте группу",
    text: "Пригласите друзей по email и задайте доли — например, 30/30/40.",
  },
  {
    icon: BellRing,
    title: "Получайте платежи",
    text: "Мы считаем долги, шлём напоминания и показываем, кто кому должен.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="h-5 w-5" />
            SubSplit
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="#how-it-works"
              className="hidden text-muted-foreground hover:text-foreground sm:block"
            >
              Как это работает
            </Link>
            <Link
              href="#calculator"
              className="hidden text-muted-foreground hover:text-foreground sm:block"
            >
              Калькулятор
            </Link>
            <Link
              href="/pricing"
              className="text-muted-foreground hover:text-foreground"
            >
              Тарифы
            </Link>
            <Button asChild variant="outline" size="sm">
              <Link href="/login">Войти</Link>
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
        <div className="mx-auto flex max-w-5xl flex-col items-center px-4 pb-20 pt-20 text-center sm:pt-28">
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            Split subscriptions,{" "}
            <span className="text-primary">not friendships</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            SubSplit делит Netflix, Spotify и всё остальное между друзьями:
            честные доли, автоматические напоминания и никаких неловких
            разговоров о деньгах.
          </p>

          <p className="mt-8 text-2xl font-semibold sm:text-3xl">
            <SavingsCounter />{" "}
            <span className="text-lg font-normal text-muted-foreground sm:text-xl">
              saved by our users this month
            </span>
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/login">
                Начать бесплатно
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#how-it-works">
                Узнать больше
                <ArrowDown className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            Бесплатно до 3 подписок · Без карты · 2 минуты до первой группы
          </p>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t bg-muted/40">
        <div className="mx-auto max-w-5xl px-4 py-20">
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight">
              Как это работает
            </h2>
            <p className="mt-3 text-muted-foreground">
              Три шага — и подписки перестают съедать ваш бюджет.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="rounded-xl border bg-background p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <step.icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-semibold text-muted-foreground">
                    Шаг {i + 1}
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
              Калькулятор экономии
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Сколько вы тратите в одиночку?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Средняя подписка стоит{" "}
              <span className="font-medium text-foreground">$12.99 в месяц</span>.
              Пять подписок — это уже $780 в год. Разделите их с тремя друзьями —
              и верните себе три четверти этой суммы.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Честный расчёт долей до копейки",
                "Напоминания должникам автоматически",
                "Годовые и ежемесячные подписки",
              ].map((item) => (
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

      {/* CTA */}
      <section className="border-t bg-primary px-4 py-16 text-primary-foreground">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center">
          <Handshake className="h-10 w-10" />
          <h2 className="max-w-xl text-3xl font-semibold tracking-tight">
            Хватит платить за всех. Делите честно.
          </h2>
          <p className="max-w-md text-primary-foreground/80">
            Создайте первую группу за две минуты — бесплатно и без карты.
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link href="/login">
              Начать бесплатно
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <ShieldCheck className="h-4 w-4" />
            SubSplit
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-6">
            <Link href="#how-it-works" className="hover:text-foreground">
              Как это работает
            </Link>
            <Link href="/pricing" className="hover:text-foreground">
              Тарифы
            </Link>
            <Link href="/login" className="hover:text-foreground">
              Вход
            </Link>
          </nav>
          <p>© {new Date().getFullYear()} SubSplit</p>
        </div>
      </footer>
    </div>
  );
}
