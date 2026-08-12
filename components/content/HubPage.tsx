import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { jsonLd, faqPageSchema, webPageSchema } from "@/lib/seo";
import { HUB_PAGES, type HubPage } from "@/lib/content/hub";

export function hubMetadata(page: HubPage): Metadata {
  const ogUrl = `/api/og?title=${encodeURIComponent(page.ogTitle)}`;
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: { canonical: page.path },
    openGraph: {
      title: page.ogTitle,
      description: page.metaDescription,
      url: page.path,
      siteName: "SubSplit",
      type: "website",
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: page.ogTitle,
      description: page.metaDescription,
      images: [ogUrl],
    },
    robots: { index: true, follow: true },
  };
}

function Header() {
  return (
    <header className="border-b border-zinc-800">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-zinc-100">
          <ShieldCheck className="h-5 w-5" />
          SubSplit
        </Link>
        <Link
          href="/pricing"
          className="text-sm text-zinc-400 hover:text-zinc-100"
        >
          Pricing
        </Link>
      </div>
    </header>
  );
}

function RelatedLinks({ page }: { page: HubPage }) {
  const related = HUB_PAGES.filter((p) =>
    page.relatedSlugs.includes(p.slug)
  ).filter((p) => p.slug !== page.slug);

  if (related.length === 0) return null;

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
      <h2 className="text-sm font-semibold text-zinc-200">Related guides</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {related.map((p) => (
          <Link
            key={p.slug}
            href={p.path}
            className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:border-emerald-500/50 hover:text-white"
          >
            {p.metaTitle.replace(" — SubSplit", "").replace(" (2026 Guide)", "")}
          </Link>
        ))}
        {page.blogSlug && (
          <Link
            href={`/blog/${page.blogSlug}`}
            className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:border-emerald-500/50 hover:text-white"
          >
            Read the blog →
          </Link>
        )}
      </div>
    </section>
  );
}

export function HubPage({ page }: { page: HubPage }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {jsonLd(faqPageSchema(page.faqs))}
      {jsonLd(
        webPageSchema({
          title: page.metaTitle,
          description: page.metaDescription,
          path: page.path,
        })
      )}
      <Header />

      <main className="mx-auto max-w-3xl px-4 py-14">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-300">
            Home
          </Link>
          <span aria-hidden> / </span>
          <span className="text-zinc-400">{page.h1}</span>
        </nav>

        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {page.h1}
        </h1>

        <div className="mt-6 space-y-4 text-zinc-300">
          {page.intro.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
          <h2 className="text-xl font-semibold">
            How to do it, step by step
          </h2>
          <ol className="mt-4 space-y-4">
            {page.steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-semibold text-emerald-400">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium text-zinc-100">{step.title}</p>
                  <p className="mt-1 text-sm text-zinc-400">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {page.costTable && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold">{page.costTable.caption}</h2>
            <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-900 text-zinc-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Plan</th>
                    <th className="px-4 py-3 font-medium">Price / mo</th>
                    <th className="px-4 py-3 font-medium">Best for</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 bg-zinc-900/40">
                  {page.costTable.rows.map((row) => (
                    <tr key={row.plan}>
                      <td className="px-4 py-3 font-medium text-zinc-100">
                        {row.plan}
                      </td>
                      <td className="px-4 py-3 text-emerald-400">{row.price}</td>
                      <td className="px-4 py-3 text-zinc-400">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-zinc-500">{page.costTable.note}</p>
          </div>
        )}

        <div className="mt-8">
          <h2 className="text-xl font-semibold">Keep it friendly</h2>
          <ul className="mt-4 space-y-2.5">
            {page.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2.5 text-zinc-300">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold">Common questions</h2>
          <div className="mt-4 space-y-3">
            {page.faqs.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3"
              >
                <summary className="cursor-pointer font-medium text-zinc-100">
                  {faq.q}
                </summary>
                <p className="mt-2 text-sm text-zinc-400">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>

        <div className="mt-10">
          <RelatedLinks page={page} />
        </div>

        <div className="mt-8 rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent p-6">
          <h2 className="text-lg font-semibold">
            Stop doing the math in your head
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            SubSplit splits the bill automatically: add the subscription, invite
            your group, and it tracks who owes what — reminders included.
          </p>
          <Link href="/login" className="mt-4 inline-block">
            <Button>
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}