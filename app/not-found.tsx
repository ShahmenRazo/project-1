import Link from "next/link";
import { CreditCard, Home, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <CreditCard className="h-5 w-5" />
            SubSplit
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <SearchX className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-primary">404</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Page not found
          </h1>
          <p className="mt-3 text-muted-foreground">
            The page you're looking for doesn't exist or has been moved. Your
            subscriptions are safe — let's get you back.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/dashboard">
                <Home className="mr-1.5 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Go to Homepage</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
