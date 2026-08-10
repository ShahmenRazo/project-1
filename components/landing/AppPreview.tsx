import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const SCREENSHOTS = [
  {
    caption: "Your subscriptions",
    text: "All your subscriptions and who owes what — in one dashboard.",
    src: "/screenshots/dashboard.png",
    alt: "SubSplit dashboard with subscription cards",
    width: 1280,
    height: 700,
  },
  {
    caption: "Split with friends",
    text: "Groups with fair shares. Everyone sees their part down to the penny.",
    src: "/screenshots/group.png",
    alt: "SubSplit group page The Apartment with member shares",
    width: 768,
    height: 524,
  },
  {
    caption: "Get reminded",
    text: "Automatic reminders (with memes) so nobody has to ask twice.",
    src: "/screenshots/reminder.png",
    alt: "SubSplit payment reminder notification",
    width: 330,
    height: 291,
  },
] as const;

/** Секция "See SubSplit in action": реальные скриншоты приложения */
export function AppPreview() {
  return (
    <section className="border-t">
      <div className="mx-auto max-w-5xl px-4 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            See SubSplit in action
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Real screenshots from the app. Built for real groups with real
            payments.
          </p>
        </div>

        <div className="mt-12 grid gap-10 md:grid-cols-3 md:items-start md:gap-6">
          {SCREENSHOTS.map((shot) => (
            <figure key={shot.caption} className="flex flex-col">
              <div className="overflow-hidden rounded-xl border bg-background shadow-lg">
                <Image
                  src={shot.src}
                  alt={shot.alt}
                  width={shot.width}
                  height={shot.height}
                  loading="lazy"
                  className="h-auto w-full"
                />
              </div>
              <figcaption className="mt-4">
                <p className="text-sm font-semibold">{shot.caption}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {shot.text}
                </p>
              </figcaption>
            </figure>
          ))}
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
