"use client";

import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Status = "idle" | "loading" | "success" | "error";

/** Email-форма в hero: сохраняет заявку в /api/waitlist (Supabase waitlist) */
export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;

    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(
          json?.error?.message === "Validation failed"
            ? "Please enter a valid email address."
            : "Something went wrong. Please try again."
        );
        return;
      }
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <p className="mt-8 rounded-full border border-emerald-600/30 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
        You're on the list — we'll be in touch!
      </p>
    );
  }

  return (
    <div className="mt-8 flex w-full max-w-md flex-col items-center">
      <p className="text-sm text-muted-foreground">Or get early access updates:</p>
      <form
        onSubmit={handleSubmit}
        className="mt-3 flex w-full flex-col gap-2 sm:flex-row"
      >
        <div className="relative flex-1">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            aria-label="Email address"
            className="pl-9"
          />
        </div>
        <Button type="submit" disabled={status === "loading"}>
          {status === "loading" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Join waitlist
        </Button>
      </form>
      {status === "error" ? (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {errorMsg}
        </p>
      ) : null}
    </div>
  );
}
