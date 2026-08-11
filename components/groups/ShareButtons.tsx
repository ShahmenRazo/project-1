"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * Кнопки шеринга пригласительной ссылки: WhatsApp, Telegram, iMessage, Copy.
 */
export function ShareButtons({
  link,
  text,
}: {
  link: string;
  text: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  }

  const buttons = [
    {
      label: "WhatsApp",
      icon: <MessageCircle className="h-4 w-4 text-emerald-600" />,
      href: `https://wa.me/?text=${encodeURIComponent(text)}`,
    },
    {
      label: "Telegram",
      icon: <Send className="h-4 w-4 text-sky-600" />,
      href: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`,
    },
    {
      label: "iMessage",
      icon: <MessageSquare className="h-4 w-4 text-blue-600" />,
      href: `sms:?body=${encodeURIComponent(text)}`,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {buttons.map((b) => (
        <Button
          key={b.label}
          variant="outline"
          size="sm"
          asChild
          className="w-full"
        >
          <a href={b.href} target="_blank" rel="noreferrer">
            {b.icon}
            {b.label}
          </a>
        </Button>
      ))}
      <Button variant="outline" size="sm" onClick={copy} className="w-full">
        {copied ? (
          <Check className="h-4 w-4 text-emerald-600" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
        Copy
      </Button>
    </div>
  );
}
