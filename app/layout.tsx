import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui/sonner";
import { CookieBanner } from "@/components/cookie/CookieBanner";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://kitstartai.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "SubSplit — Split subscriptions, not friendships",
    template: "%s — SubSplit",
  },
  description:
    "Split subscription costs with friends: automatic share calculation, reminders and payment tracking for Netflix, Spotify, ChatGPT and more.",
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: ["/favicon.ico", "/icons/icon-192.png", "/icons/icon-512.png"],
    apple: ["/apple-touch-icon.png", "/icons/apple-touch-icon.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SubSplit",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "SubSplit",
    title: "SubSplit — Split subscriptions, not friendships",
    description:
      "Split subscription costs with friends: automatic share calculation, reminders and payment tracking for Netflix, Spotify, ChatGPT and more.",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SubSplit — Split subscriptions, not friendships",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SubSplit — Split subscriptions, not friendships",
    description:
      "Split subscription costs with friends: automatic share calculation, reminders and payment tracking.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#18181b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        {children}
        <Footer />
        <CookieBanner />
        <Toaster richColors closeButton position="top-center" />
      </body>
    </html>
  );
}
