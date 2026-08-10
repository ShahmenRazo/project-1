import Link from "next/link";
import { Apple, ArrowRight, Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

const DEVICES = [
  { icon: Apple, label: "iPhone" },
  { icon: Smartphone, label: "Android" },
  { icon: Monitor, label: "Desktop" },
] as const;

/** Секция PWA: продукт работает на любом устройстве без app store */
export function AvailableEverywhere() {
  return (
    <section className="border-t">
      <div className="mx-auto flex max-w-5xl flex-col items-center px-4 py-20 text-center">
        <h2 className="text-3xl font-semibold tracking-tight">
          Works on any device
        </h2>
        <p className="mt-3 max-w-md text-muted-foreground">
          Add to your home screen — no app store needed. It feels like a native
          app, works offline, and stays in sync everywhere.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {DEVICES.map((device) => (
            <span
              key={device.label}
              className="flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm font-medium"
            >
              <device.icon className="h-4 w-4 text-primary" />
              {device.label}
            </span>
          ))}
        </div>

        <Button asChild size="lg" className="mt-10">
          <Link href="/login">
            Open SubSplit
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
