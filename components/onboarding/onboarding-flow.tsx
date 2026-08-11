"use client";

import { useEffect, useState } from "react";import { useRouter } from "next/navigation";
import { ArrowRight, Camera, Check, Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { apiErrorMessageAsync } from "@/lib/client-errors";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBrowserClientInstance } from "@/lib/supabase/client";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,20}$/;
const VENMO_RE = /^[a-zA-Z0-9_.-]{2,32}$/;
const CASH_TAG_RE = /^[a-zA-Z0-9_-]{3,32}$/;
const ZELLE_RE =
  /^([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|\+?[0-9][0-9\s().-]{5,})$/;

interface OnboardingInitial {
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  venmo_username: string | null;
  cash_tag: string | null;
  zelle_email: string | null;
}

type UsernameState =
  | { status: "idle" | "checking" | "available"; message?: string }
  | { status: "taken" | "invalid"; message: string };

export function OnboardingFlow({ initial }: { initial: OnboardingInitial }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

  const [displayName, setDisplayName] = useState(initial.display_name ?? "");
  const [username, setUsername] = useState(initial.username ?? "");
  const [usernameState, setUsernameState] = useState<UsernameState>({
    status: initial.username ? "available" : "idle",
  });
  const [avatarUrl, setAvatarUrl] = useState(initial.avatar_url ?? "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [venmo, setVenmo] = useState(initial.venmo_username ?? "");
  const [cashTag, setCashTag] = useState(initial.cash_tag ?? "");
  const [zelle, setZelle] = useState(initial.zelle_email ?? "");
  const [saving, setSaving] = useState(false);

  // Debounced проверка username (300 мс)
  useEffect(() => {
    const value = username.trim();
    if (!value) {
      setUsernameState({ status: "idle" });
      return;
    }
    if (!USERNAME_RE.test(value)) {
      setUsernameState({
        status: "invalid",
        message:
          "3–20 chars: letters, digits, dot, dash, underscore",
      });
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      setUsernameState({ status: "checking" });
      fetch(`/api/username-check?value=${encodeURIComponent(value)}`)
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
              status: "taken",
              message: "This username is already taken",
            });
          }
        })
        .catch(() => {
          if (!cancelled) setUsernameState({ status: "idle" });
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [username]);

  const canContinue =
    displayName.trim().length > 0 &&
    usernameState.status === "available" &&
    !uploadingAvatar;

  const resizeImage = (file: File): Promise<Blob> =>
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
          if (blob) resolve(blob);
          else reject(new Error("Could not process image"));
        }, "image/jpeg");
      };
      img.onerror = () => reject(new Error("Invalid image"));
      img.src = URL.createObjectURL(file);
    });

  const handleAvatar = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setUploadingAvatar(true);
    try {
      const blob = await resizeImage(file);
      const supabase = createBrowserClientInstance();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const path = `${user.id}/avatar.jpg`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
      if (error) throw error;

      const { data: publicUrl } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);
      setAvatarUrl(publicUrl.publicUrl);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload avatar"
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleFinish = async (skipHandles: boolean) => {
    if (saving) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        username: username.trim(),
        display_name: displayName.trim(),
        avatar_url: avatarUrl,
        onboarding_completed: true,
      };
      if (!skipHandles) {
        body.venmo_username = venmo.trim();
        body.cash_tag = cashTag.trim().replace(/^\$/, "");
        body.zelle_email = zelle.trim();
      }

      const res = await fetch("/api/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;

      if (!res.ok) {
        toast.error(
          await apiErrorMessageAsync(
            res,
            json?.error?.message ?? "Failed to save profile"
          )
        );
        return;
      }

      toast.success("Welcome to SubSplit!");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Network error, please try again");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {step === 1 ? "Set up your profile" : "How will friends pay you?"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {step === 1
              ? "Friends will see your name and photo in groups."
              : "Optional — you can add payment details later in Profile."}
          </p>
        </div>
        <span className="text-xs text-muted-foreground">
          Step {step} of 2
        </span>
      </div>

      {step === 1 ? (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {avatarUrl && (
                <AvatarImage src={avatarUrl} alt={displayName || "Avatar"} />
              )}
              <AvatarFallback className="text-base">
                {initials(displayName || "?")}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploadingAvatar}
                onClick={() => document.getElementById("avatar-input")?.click()}
              >
                {uploadingAvatar ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="mr-2 h-4 w-4" />
                )}
                {avatarUrl ? "Change photo" : "Add photo"}
              </Button>
              {avatarUrl && (
                <button
                  type="button"
                  className="block text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setAvatarUrl("")}
                >
                  Remove
                </button>
              )}
              <p className="text-xs text-muted-foreground">
                Square photo, at least 256×256 px
              </p>
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
            <Label htmlFor="display-name">Your name</Label>
            <Input
              id="display-name"
              placeholder="Alex Doe"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              autoFocus
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                @
              </span>
              <Input
                id="username"
                placeholder="alexdoe"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.replace(/\s+/g, ""))
                }
                maxLength={20}
                className={cn(
                  "pl-7 pr-9",
                  usernameState.status === "available" &&
                    "border-emerald-500/60 focus-visible:ring-emerald-500/30"
                )}
                aria-invalid={usernameState.status === "taken" || usernameState.status === "invalid"}
              />
              {usernameState.status === "checking" && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
              {usernameState.status === "available" && (
                <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600" />
              )}
            </div>
            {usernameState.status === "taken" && (
              <p className="text-xs text-destructive">{usernameState.message}</p>
            )}
            {usernameState.status === "invalid" && (
              <p className="text-xs text-destructive">{usernameState.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Friends can invite you to groups by username.
            </p>
          </div>

          <Button
            className="w-full"
            disabled={!canContinue}
            onClick={() => setStep(2)}
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <p className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2.5 text-sm">
            <Sparkles className="h-4 w-4 shrink-0 text-primary" />
            Add Venmo, Cash App or Zelle so group members can pay you instantly.
          </p>

          <div className="space-y-4">
            <div className="grid gap-1.5">
              <Label htmlFor="venmo" className="text-xs text-muted-foreground">
                Venmo username
              </Label>
              <Input
                id="venmo"
                value={venmo}
                onChange={(e) => setVenmo(e.target.value)}
                placeholder="@your-venmo"
                className="h-10"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cash" className="text-xs text-muted-foreground">
                Cash App $cashtag
              </Label>
              <Input
                id="cash"
                value={cashTag}
                onChange={(e) => setCashTag(e.target.value)}
                placeholder="$yourcashtag"
                className="h-10"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="zelle" className="text-xs text-muted-foreground">
                Zelle email or phone
              </Label>
              <Input
                id="zelle"
                value={zelle}
                onChange={(e) => setZelle(e.target.value)}
                placeholder="you@bank.com"
                className="h-10"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Button
              className="w-full"
              disabled={saving}
              onClick={() => void handleFinish(false)}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? "Saving…" : "Finish"}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              disabled={saving}
              onClick={() => void handleFinish(true)}
            >
              Skip for now
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
