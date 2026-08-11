"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { createBrowserClientInstance } from "@/lib/supabase/client";

/**
 * Минимальная авторизация прямо на /join/[token]:
 * Google OAuth или magic link (email). После входа страница
 * перезагружается и пользователь попадает в группу автоматически.
 */
export function JoinAuthForm({ token }: { token: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [oauthLoading, setOauthLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const handled = useRef(false);

  // Сессия после возврата с magic link (token_hash в URL) — авто-логин
  useEffect(() => {
    const supabase = createBrowserClientInstance();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" && !handled.current) {
        handled.current = true;
        router.refresh();
      }
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session && !handled.current) {
        handled.current = true;
        router.refresh();
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  const handleOAuth = async (provider: "google" | "apple") => {
    if (oauthLoading) return;
    setOauthLoading(true);
    try {
      const supabase = createBrowserClientInstance();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/join/${token}`,
        },
      });
      if (error) throw error;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not start sign-in"
      );
      setOauthLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (magicLoading || !email.trim()) return;
    setMagicLoading(true);
    try {
      const supabase = createBrowserClientInstance();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/join/${token}`,
        },
      });
      if (error) throw error;
      setMagicSent(true);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not send magic link"
      );
    } finally {
      setMagicLoading(false);
    }
  };

  if (magicSent) {
    return (
      <div className="rounded-xl bg-muted/60 px-4 py-4 text-center text-sm">
        Check your inbox — we sent you a magic link. Open it and you'll join
        the group automatically.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        className="tap-active w-full"
        onClick={() => void handleOAuth("google")}
        disabled={oauthLoading}
      >
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82Z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24Z"
          />
          <path
            fill="#FBBC05"
            d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.29a12.01 12.01 0 0 0 0 10.76l3.98-3.09Z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
          />
        </svg>
        {oauthLoading ? "Redirecting…" : "Continue with Google"}
      </Button>

      <Button
        type="button"
        variant="outline"
        className="tap-active w-full"
        onClick={() => void handleOAuth("apple")}
        disabled={oauthLoading}
      >
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M17.05 12.54c-.03-2.9 2.37-4.3 2.47-4.37-1.35-1.97-3.44-2.24-4.18-2.27-1.78-.18-3.47 1.05-4.37 1.05-.9 0-2.29-1.02-3.77-1-1.94.03-3.72 1.13-4.72 2.86-2.01 3.49-.51 8.66 1.45 11.49.96 1.39 2.1 2.95 3.6 2.89 1.44-.06 1.99-.93 3.73-.93 1.75 0 2.24.93 3.76.9 1.56-.03 2.54-1.41 3.49-2.81 1.1-1.6 1.55-3.16 1.58-3.24-.03-.02-3.02-1.16-3.04-4.57Zm-2.84-8.38c.8-.97 1.33-2.32 1.19-3.66-1.15.05-2.54.77-3.36 1.73-.74.86-1.39 2.23-1.21 3.55 1.28.1 2.58-.65 3.38-1.62Z" />
        </svg>
        {oauthLoading ? "Redirecting…" : "Continue with Apple"}
      </Button>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>

      <form onSubmit={handleMagicLink} className="flex gap-2">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
          className="h-10 min-w-0 flex-1"
        />
        <Button
          type="submit"
          disabled={magicLoading || !email.trim()}
          className="tap-active h-10 shrink-0"
        >
          {magicLoading ? "Sending…" : "Email me a link"}
        </Button>
      </form>
      <p className="text-center text-xs text-muted-foreground">
        No password needed. Already have an account?{" "}
        <a href={`/login?next=/join/${token}`} className="underline underline-offset-2">
          Log in
        </a>
      </p>
    </div>
  );
}