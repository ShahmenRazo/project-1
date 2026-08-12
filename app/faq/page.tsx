import type { Metadata } from "next";
import Link from "next/link";
import { HelpCircle, ShieldCheck } from "lucide-react";
import { FAQ_ITEMS } from "@/lib/faq";
import { jsonLd, faqPageSchema, ORGANIZATION_SCHEMA } from "@/lib/seo";

export const metadata: Metadata = {
  title: "FAQ — How SubSplit Works",
  description:
    "Answers about sharing Netflix, Spotify and ChatGPT costs: how payments work, is it secure, what if a friend doesn't pay, and more.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "FAQ — How SubSplit Works",
    description:
      "Answers about sharing Netflix, Spotify and ChatGPT costs: how payments work, is it secure, what if a friend doesn't pay, and more.",
    url: "/faq",
    type: "website",
    siteName: "SubSplit",
    images: [
      { url: "/api/og?title=SubSplit%20FAQ", width: 1200, height: 630 },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ — How SubSplit Works",
    description:
      "Answers about sharing Netflix, Spotify and ChatGPT costs: how payments work, is it secure, what if a friend doesn't pay, and more.",
    images: ["/api/og?title=SubSplit%20FAQ"],
  },
};

export default function FAQPage() {
  return (
    <div className="min-h-screen">
      {jsonLd(faqPageSchema(FAQ_ITEMS as unknown as { q: string; a: string }[]))}
      {jsonLd(ORGANIZATION_SCHEMA)}

      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="h-5 w-5" />
            SubSplit
          </Link>
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:underline"
          >
            Sign In
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-16">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <HelpCircle className="h-4 w-4" />
          FAQ
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="mt-3 text-muted-foreground">
          Everything you need to know about splitting subscriptions with
          friends — no awkward money talks required.
        </p>

        <dl className="mt-10 space-y-6">
          {FAQ_ITEMS.map((item) => (
            <div
              key={item.q}
              className="rounded-xl border bg-card p-6"
            >
              <dt className="text-lg font-semibold">{item.q}</dt>
              <dd className="mt-2 text-muted-foreground">{item.a}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-12 rounded-xl border bg-muted/40 p-6 text-center">
          <p className="text-muted-foreground">
            Want the full picture? Read how to{" "}
            <Link
              href="/blog/how-to-split-netflix-cost"
              className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
            >
              split a Netflix account
            </Link>{" "}
            or compare{" "}
            <Link
              href="/pricing"
              className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
            >
              Free vs Pro plans
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
