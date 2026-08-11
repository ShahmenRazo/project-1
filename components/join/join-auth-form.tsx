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

  const handleGoogle = async () => {
    if (oauthLoading) return;
    setOauthLoading(true);
    try {
      const supabase = createBrowserClientInstance();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/join/${token}`,
        },
      });
      if (error) throw error;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not start Google sign-in"
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
        onClick={() => void handleGoogle()}
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