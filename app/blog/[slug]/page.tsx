import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BLOG_POSTS, getPostBySlug } from "@/lib/blog/posts";
import { jsonLd, blogPostingSchema } from "@/lib/seo";

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const post = getPostBySlug(params.slug);
  if (!post) return {};

  return {
    title: `${post.title} | SubSplit Blog`,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `/blog/${post.slug}`,
      type: "article",
      publishedTime: post.date,
      images: [{ url: "/api/og", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: ["/api/og"],
    },
  };
}

/** Рендер [[text|/path]] как internal-ссылки, остальное — текст */
function renderInline(text: string) {
  const parts = text.split(/\[\[([^\]]+)\|([^\]]+)\]\]/);
  return parts.map((part, i) => {
    if (i % 3 === 0) return part;
    if (i % 3 === 1) {
      const label = part;
      const href = parts[i + 1];
      return (
        <Link
          key={i}
          href={href}
          className="font-medium text-primary underline underline-offset-4 hover:opacity-80"
        >
          {label}
        </Link>
      );
    }
    return null;
  });
}

export default function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  return (
    <div className="min-h-screen">
      {jsonLd(
        blogPostingSchema({
          title: post.title,
          description: post.excerpt,
          slug: post.slug,
          date: post.date,
        })
      )}

      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="h-5 w-5" />
            SubSplit
          </Link>
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All articles
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-14">
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

        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          {post.title}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{post.excerpt}</p>

        <div className="mt-10 space-y-5">
          {post.sections.map((block, i) => {
            if (block.type === "h2") {
              return (
                <h2
                  key={i}
                  className="pt-4 text-2xl font-semibold tracking-tight"
                >
                  {block.text}
                </h2>
              );
            }
            if (block.type === "cta") {
              return (
                <div key={i} className="flex justify-center pt-4">
                  <Button asChild size="lg">
                    <Link href={block.link}>{block.text}</Link>
                  </Button>
                </div>
              );
            }
            return (
              <p key={i} className="leading-relaxed text-foreground/80">
                {renderInline(block.text)}
              </p>
            );
          })}
        </div>

        <div className="mt-14 border-t pt-8">
          <h2 className="text-lg font-semibold">More from the blog</h2>
          <div className="mt-4 space-y-3">
            {BLOG_POSTS.filter((p) => p.slug !== post.slug).map((p) => (
              <Link
                key={p.slug}
                href={`/blog/${p.slug}`}
                className="block rounded-lg border p-4 text-sm transition-colors hover:border-primary"
              >
                <span className="font-medium text-foreground">{p.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
