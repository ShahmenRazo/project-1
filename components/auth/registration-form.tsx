"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Check,
  Loader2,
  Sparkles,
} from "lucide-react";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { toast } from "sonner";
import { apiErrorMessageAsync } from "@/lib/client-errors";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { createBrowserClientInstance } from "@/lib/supabase/client";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

type UsernameState =
  | { status: "idle" | "checking" | "available"; message?: string }
  | { status: "taken" | "invalid"; message: string };

export function RegistrationForm({
  onSwitchToLogin,
}: {
  onSwitchToLogin: () => void;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameState, setUsernameState] = useState<UsernameState>({
    status: "idle",
  });

  const [phoneValue, setPhoneValue] = useState("");
  const [phoneParsed, setPhoneParsed] = useState<{
    valid: boolean;
    e164: string | null;
  }>({ valid: false, e164: null });

  const [avatarData, setAvatarData] = useState("");
  const [processingAvatar, setProcessingAvatar] = useState(false);

  const [venmo, setVenmo] = useState("");
  const [cashTag, setCashTag] = useState("");
  const [zelle, setZelle] = useState("");
  const [zellePhone, setZellePhone] = useState("");

  // Prefill display name из email, пока пользователь не вводил имя сам
  const [nameTouched, setNameTouched] = useState(false);
  useEffect(() => {
    if (nameTouched || !email.includes("@")) return;
    const prefix = email.split("@")[0].replace(/[._-]+/g, " ");
    if (prefix.trim()) {
      setDisplayName((prev) => prev || prefix.trim().replace(/\b\w/g, (c) => c.toUpperCase()));
    }
  }, [email, nameTouched]);

  // Debounced проверка username (400 мс)
  useEffect(() => {
    const value = username.trim();
    if (!value) {
      setUsernameState({ status: "idle" });
      return;
    }
    if (!USERNAME_RE.test(value)) {
      setUsernameState({
        status: "invalid",
        message: "3–20 characters: letters, digits and underscore only",
      });
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      setUsernameState({ status: "checking" });
      fetch(`/api/check-username?username=${encodeURIComponent(value)}`)
        .then((res) => res.json())
        .then((json) => {
          if (cancelled) return;
          const data = json?.data as
            | { available: boolean; invalid?: boolean }
            | undefined;
          if (data?.available) {
            setUsernameState({ status: "available" });
          } else {
            setUsernameState({
              status: data?.invalid ? "invalid" : "taken",
              message: data?.invalid
                ? "3–20 characters: letters, digits and underscore only"
                : "This username is already taken",
            });
          }
        })
        .catch(() => {
          if (!cancelled) setUsernameState({ status: "idle" });
        });
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [username]);

  const zellePhoneValid = useMemo(() => {
    const raw = zellePhone.trim();
    if (!raw) return true;
    const parsed = parsePhoneNumberFromString(raw, "US");
    return Boolean(parsed?.isValid());
  }, [zellePhone]);

  const canSubmit =
    email.includes("@") &&
    password.length >= 6 &&
    password === confirmPassword &&
    displayName.trim().length > 0 &&
    usernameState.status === "available" &&
    phoneParsed.valid &&
    zellePhoneValid &&
    !saving &&
    !processingAvatar;

  const resizeImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const size = 256;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas not supported"));
          return;
        }
        const side = Math.min(img.width, img.height);
        ctx.drawImage(
          img,
          (img.width - side) / 2,
          (img.height - side) / 2,
          side,
          side,
          0,
          0,
          size,
          size
        );
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error("Could not process image"));
            return;
          }
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error("Could not read image"));
          reader.readAsDataURL(blob);
        }, "image/jpeg", 0.85);
      };
      img.onerror = () => reject(new Error("Invalid image"));
      img.src = URL.createObjectURL(file);
    });

  const handleAvatar = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setProcessingAvatar(true);
    try {
      const dataUrl = await resizeImage(file);
      setAvatarData(dataUrl);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to process image"
      );
    } finally {
      setProcessingAvatar(false);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const res = await fetch("/api/auth/signup-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          confirm_password: confirmPassword,
          username: username.trim(),
          display_name: displayName.trim(),
          phone_number: phoneParsed.e164,
          avatar_data: avatarData || undefined,
          venmo_username: venmo.trim(),
          cash_tag: cashTag.trim(),
          zelle_email: zelle.trim(),
          zelle_phone: zellePhone.trim() || undefined,
        }),
      });
      const json = (await res.json().catch(() => null)) as {
        data?: { session?: unknown };
        error?: { message?: string };
      } | null;

      if (!res.ok) {
        toast.error(
          await apiErrorMessageAsync(
            res,
            json?.error?.message ?? "Failed to create account"
          )
        );
        return;
      }

      if (json?.data?.session) {
        const supabase = createBrowserClientInstance();
        await supabase.auth.setSession(
          json.data.session as Parameters<typeof supabase.auth.setSession>[0]
        );
        toast.success(`Welcome to SubSplit, ${username.trim()}!`);
        router.push("/dashboard");
        router.refresh();
      } else {
        toast.success("Check your inbox to confirm your email");
        router.push("/login?email_sent=1");
      }
    } catch {
      toast.error("Network error, please try again");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          {avatarData && <AvatarImage src={avatarData} alt="Avatar preview" />}
          <AvatarFallback className="text-base">
            {initials(displayName || "?")}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={processingAvatar}
            onClick={() => document.getElementById("avatar-input")?.click()}
          >
            {processingAvatar ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Camera className="mr-2 h-4 w-4" />
            )}
            {avatarData ? "Change photo" : "Add photo"}
          </Button>
          {avatarData && (
            <button
              type="button"
              className="block text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setAvatarData("")}
            >
              Remove
            </button>
          )}
          <p className="text-xs text-muted-foreground">Optional</p>
          <input
            id="avatar-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleAvatar(file);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          type="password"
          placeholder="At least 6 characters"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="signup-confirm">Confirm password</Label>
        <Input
          id="signup-confirm"
          type="password"
          placeholder="Repeat your password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          aria-invalid={
            confirmPassword.length > 0 && confirmPassword !== password
          }
        />
        {confirmPassword.length > 0 && confirmPassword !== password && (
          <p className="text-xs text-destructive">Passwords do not match</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="signup-name">Display name</Label>
        <Input
          id="signup-name"
          placeholder="Alex Doe"
          value={displayName}
          onChange={(e) => {
            setNameTouched(true);
            setDisplayName(e.target.value);
          }}
          maxLength={50}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="signup-username">Username</Label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
            @
          </span>
          <Input
            id="signup-username"
            placeholder="alexdoe"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value.replace(/\s+/g, ""))
            }
            maxLength={20}
            required
            className={cn(
              "pl-7 pr-9",
              usernameState.status === "available" &&
                "border-emerald-500/60 focus-visible:ring-emerald-500/30"
            )}
            aria-invalid={
              usernameState.status === "taken" ||
              usernameState.status === "invalid"
            }
          />
          {usernameState.status === "checking" && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
          {usernameState.status === "available" && (
            <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600" />
          )}
        </div>
        {(usernameState.status === "taken" ||
          usernameState.status === "invalid") && (
          <p className="text-xs text-destructive">{usernameState.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Friends can invite you to groups by username. It&apos;s public.
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="signup-phone">Phone number</Label>
        <PhoneInput
          id="signup-phone"
          value={phoneValue}
          onValueChange={setPhoneValue}
          onParsed={(valid, e164) => setPhoneParsed({ valid, e164 })}
        />
        {phoneValue && !phoneParsed.valid && (
          <p className="text-xs text-destructive">Enter a valid phone number</p>
        )}
        <p className="text-xs text-muted-foreground">
          Used for payment reminders and group invites. We never share it.
        </p>
      </div>

      <div className="space-y-3 rounded-lg border p-3">
        <p className="flex items-center gap-2 text-xs font-medium">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Payment handles <span className="font-normal text-muted-foreground">(optional — friends can pay you back)</span>
        </p>
        <div className="grid gap-1.5">
          <Label htmlFor="signup-venmo" className="text-xs text-muted-foreground">
            Venmo username
          </Label>
          <Input
            id="signup-venmo"
            value={venmo}
            onChange={(e) => setVenmo(e.target.value.trimStart())}
            placeholder="@your-venmo"
            className="h-10"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="signup-cash" className="text-xs text-muted-foreground">
            Cash App $cashtag
          </Label>
          <Input
            id="signup-cash"
            value={cashTag}
            onChange={(e) => setCashTag(e.target.value.trimStart())}
            placeholder="$yourcashtag"
            className="h-10"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="signup-zelle" className="text-xs text-muted-foreground">
            Zelle email
          </Label>
          <Input
            id="signup-zelle"
            type="email"
            value={zelle}
            onChange={(e) => setZelle(e.target.value)}
            placeholder="you@bank.com"
            className="h-10"
          />
        </div>
        <div className="grid gap-1.5">
          <Label
            htmlFor="signup-zelle-phone"
            className="text-xs text-muted-foreground"
          >
            Zelle phone number
          </Label>
          <Input
            id="signup-zelle-phone"
            inputMode="tel"
            value={zellePhone}
            onChange={(e) =>
              setZellePhone(e.target.value.replace(/[^\d+]/g, ""))
            }
            placeholder="+1 (202) 555-0123"
            className="h-10"
          />
          {zellePhone.trim() && !zellePhoneValid && (
            <p className="text-xs text-destructive">
              Enter a valid phone number
            </p>
          )}
        </div>
      </div>

      <Button
        type="button"
        className="w-full"
        disabled={!canSubmit}
        onClick={() => void handleSubmit()}
      >
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {saving ? "Creating…" : "Create Account"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <button
          type="button"
          className="font-medium text-foreground underline underline-offset-4"
          onClick={onSwitchToLogin}
        >
          Sign in
        </button>
      </p>
    </div>
  );
}
