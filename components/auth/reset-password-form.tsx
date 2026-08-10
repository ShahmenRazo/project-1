"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBrowserClientInstance } from "@/lib/supabase/client";

/**
 * Два режима:
 * 1) Без токена — форма запроса сброса (POST /api/auth/reset-password).
 * 2) С токеном (?token=... из письма) — установка нового пароля
 *    через verifyOtp(type=recovery) + updateUser.
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const tokenHash = searchParams.get("token_hash");
  const emailFromUrl = searchParams.get("email");
  const hasRecoveryCode = Boolean(token || tokenHash);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRequestReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Failed to send the email");
      toast.success("Email with the link sent. Check your inbox");
      setEmail("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send");
    } finally {
      setLoading(false);
    }
  }

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const supabase = createBrowserClientInstance();

      if (tokenHash) {
        // Современный GoTrue: ссылка содержит token_hash (email не нужен)
        const { error: otpError } = await supabase.auth.verifyOtp({
          type: "recovery",
          token_hash: tokenHash,
        });
        if (otpError) throw otpError;
      } else if (token && emailFromUrl) {
        const { error: otpError } = await supabase.auth.verifyOtp({
          type: "recovery",
          token,
          email: emailFromUrl,
        });
        if (otpError) throw otpError;
      } else if (token) {
        throw new Error(
          "Link expired — request a password reset again"
        );
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) throw updateError;

      toast.success("Password updated. Sign in with your new password");
      router.push("/login");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update the password. The link may have expired"
      );
    } finally {
      setLoading(false);
    }
  }

  if (hasRecoveryCode) {
    return (
      <form onSubmit={handleSetPassword} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            placeholder="At least 6 characters"
            autoComplete="new-password"
            minLength={6}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm">Repeat password</Label>
          <Input
            id="confirm"
            type="password"
            placeholder="Again"
            autoComplete="new-password"
            minLength={6}
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Saving…" : "Save password"}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleRequestReset} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Sending…" : "Send link"}
      </Button>
    </form>
  );
}
