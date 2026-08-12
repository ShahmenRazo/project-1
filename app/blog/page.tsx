import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { BLOG_POSTS } from "@/lib/blog/posts";

export const metadata: Metadata = {
  title: "Blog — SubSplit Subscription Money Tips",
  description:
    "Guides on splitting Netflix, Spotify and ChatGPT costs, auditing unused subscriptions, and keeping shared accounts fair — from the SubSplit team.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog — SubSplit Subscription Money Tips",
    description:
      "Guides on splitting Netflix, Spotify and ChatGPT costs, auditing unused subscriptions, and keeping shared accounts fair.",
    url: "/blog",
    type: "website",
    siteName: "SubSplit",
    images: [
      { url: "/api/og?title=SubSplit%20Blog", width: 1200, height: 630 },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog — SubSplit Subscription Money Tips",
    description:
      "Guides on splitting Netflix, Spotify and ChatGPT costs, auditing unused subscriptions, and keeping shared accounts fair.",
    images: ["/api/og?title=SubSplit%20Blog"],
  },
};

export default function BlogPage() {
  return (
    <div className="min-h-screen">
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
        <p className="text-sm font-medium text-primary">Blog</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          Subscription money tips
        </h1>
        <p className="mt-3 text-muted-foreground">
          Practical guides on splitting subscription costs with friends,
          auditing what you actually use, and keeping shared accounts fair.
        </p>

        <div className="mt-10 space-y-6">
          {BLOG_POSTS.map((post) => (
            <article key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="group block rounded-2xl border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <time dateTime={post.date}>
                    {new Date(post.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                  <span aria-hidden>·</span>
                  <span>{post.readTime}</span>
                </div>
                <h2 className="mt-3 text-xl font-semibold group-hover:text-primary">
                  {post.title}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {post.excerpt}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Read article
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
