import type { MetadataRoute } from "next";
import { BLOG_POSTS } from "@/lib/blog/posts";
import { HUB_PAGES } from "@/lib/content/hub";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://kitstartai.com";

const STATIC_PAGES: { path: string; priority: 0.0 | 0.1 | 0.2 | 0.3 | 0.4 | 0.5 | 0.6 | 0.7 | 0.8 | 0.9 | 1.0 }[] = [
  { path: "/", priority: 1.0 },
  { path: "/pricing", priority: 0.8 },
  { path: "/faq", priority: 0.7 },
  { path: "/blog", priority: 0.7 },
  { path: "/terms", priority: 0.3 },
  { path: "/privacy", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority,
  }));

  const hubEntries: MetadataRoute.Sitemap = HUB_PAGES.map((page) => ({
    url: `${SITE_URL}${page.path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const blogEntries: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticEntries, ...hubEntries, ...blogEntries];
}