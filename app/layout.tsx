import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { CookieBanner } from "@/components/cookie/CookieBanner";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { PwaShell } from "@/components/layout/pwa-shell";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://kitstartai.com";

// Inter с display: swap — нет layout shift при загрузке шрифта
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "SubSplit — Split Subscriptions with Friends | Save $500+/Year",
    template: "%s",
  },
  description:
    "Split Netflix, Spotify & ChatGPT costs with roommates automatically. SubSplit tracks who owes what and sends reminders — save $500+/year. Free to start.",
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
    title: "SubSplit — Split Subscriptions with Friends | Save $500+/Year",
    description:
      "Split Netflix, Spotify & ChatGPT costs with roommates automatically. SubSplit tracks who owes what and sends reminders — save $500+/year. Free to start.",
    locale: "en_US",
    images: [
      {
        url: `${SITE_URL}/api/og`,
        width: 1200,
        height: 630,
        alt: "SubSplit — Split Subscriptions with Friends",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SubSplit — Split Subscriptions with Friends | Save $500+/Year",
    description:
      "Split Netflix, Spotify & ChatGPT costs with roommates automatically. SubSplit tracks who owes what and sends reminders — save $500+/year. Free to start.",
    images: [`${SITE_URL}/api/og`],
  },
};

export const viewport: Viewport = {
  themeColor: "#0f0f0f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <GoogleAnalytics />
        {children}
        <PwaShell />
        <Footer />
        <CookieBanner />
        <Toaster richColors closeButton position="top-center" />
      </body>
    </html>
  );
}
