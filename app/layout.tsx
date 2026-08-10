import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "SubSplit — делите подписки с друзьями",
  description:
    "Сервис для совместной оплаты подписок: автоматический расчёт долей, напоминания и отчёты.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: ["/icons/icon-192.png", "/icons/icon-512.png"],
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SubSplit",
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
        <Toaster richColors closeButton position="top-center" />
      </body>
    </html>
  );
}
