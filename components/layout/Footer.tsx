import Link from "next/link";
import { ShieldCheck } from "lucide-react";

const COPY = {
  brand: "SubSplit",
  tagline: "Split subscriptions, not friendships",
  columns: [
    {
      title: "Product",
      links: [
        { label: "Features", href: "/#how-it-works" },
        { label: "Pricing (Coming soon)", href: "/pricing" },
        { label: "FAQ", href: "/faq" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "Blog", href: "/blog" },
        { label: "Contact", href: "mailto:support@kitstartai.com" },
      ],
    },
    {
      title: "Guides",
      links: [
        {
          label: "Split Netflix",
          href: "/split-netflix",
        },
        {
          label: "Split Spotify",
          href: "/split-spotify",
        },
        {
          label: "Split ChatGPT",
          href: "/split-chatgpt",
        },
        {
          label: "Split Disney+",
          href: "/split-disney-plus",
        },
        {
          label: "How to split subscriptions",
          href: "/how-to-split-subscriptions",
        },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
      ],
    },
  ],
  copyright: "© 2026 SubSplit. All rights reserved.",
} as const;

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 text-zinc-400">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold text-zinc-100"
            >
              <ShieldCheck className="h-5 w-5" />
              {COPY.brand}
            </Link>
            <p className="text-sm">{COPY.tagline}</p>
          </div>

          {COPY.columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-zinc-200">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-zinc-800 pt-6 sm:flex-row">
          <p className="text-sm">{COPY.copyright}</p>
          <div className="flex items-center gap-4">
            <a
              href="https://x.com/subsplit"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X (Twitter)"
              className="transition-colors hover:text-white"
            >
              <TwitterIcon className="h-4 w-4" />
            </a>
            <a
              href="https://www.tiktok.com/@subsplit"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className="transition-colors hover:text-white"
            >
              <TikTokIcon className="h-4 w-4" />
            </a>
            <a
              href="https://www.instagram.com/subsplit"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="transition-colors hover:text-white"
            >
              <InstagramIcon className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
