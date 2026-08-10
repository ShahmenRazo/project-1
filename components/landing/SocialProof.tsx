import { Star, TrendingUp } from "lucide-react";

const TESTIMONIALS = [
  {
    quote:
      "I was paying $140/mo alone. Now my 3 roommates and I split everything. I save $800/year.",
    name: "Alex",
    city: "NY",
  },
  {
    quote:
      "No more awkward 'hey you owe me' texts. SubSplit handles it.",
    name: "Jordan",
    city: "LA",
  },
  {
    quote: "The meme reminders actually work. My friends pay faster now.",
    name: "Sam",
    city: "Austin",
  },
] as const;

function Stars() {
  return (
    <div className="flex gap-0.5" aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className="h-4 w-4 fill-amber-400 text-amber-400"
          aria-hidden
        />
      ))}
    </div>
  );
}

/** Блок социального доказательства: цифра пользователей + отзывы */
export function SocialProof() {
  return (
    <section className="border-t bg-muted/40">
      <div className="mx-auto max-w-5xl px-4 py-20">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary">
            <TrendingUp className="h-4 w-4" />
            Join 2,000+ users saving money
          </div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            Roommates. Friends. Family. Everyone saves.
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <blockquote
              key={t.name}
              className="flex flex-col justify-between rounded-xl border bg-background p-6"
            >
              <div>
                <Stars />
                <p className="mt-4 text-sm leading-relaxed">"{t.quote}"</p>
              </div>
              <footer className="mt-5 text-sm font-medium text-muted-foreground">
                — {t.name}, {t.city}
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
