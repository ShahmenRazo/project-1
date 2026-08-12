"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Camera,
  Check,
  ChevronLeft,
  Loader2,
  Phone,
  Sparkles,
} from "lucide-react";
import {
  AsYouType,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";
import { toast } from "sonner";
import { apiErrorMessageAsync } from "@/lib/client-errors";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createBrowserClientInstance } from "@/lib/supabase/client";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

interface OnboardingInitial {
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  phone_number: string | null;
  venmo_username: string | null;
  cash_tag: string | null;
  zelle_email: string | null;
  zelle_phone: string | null;
}

type UsernameState =
  | { status: "idle" | "checking" | "available"; message?: string }
  | { status: "taken" | "invalid"; message: string };

const PHONE_COUNTRIES: { iso: CountryCode; label: string; dial: string }[] = [
  { iso: "US", label: "US", dial: "+1" },
  { iso: "CA", label: "Canada", dial: "+1" },
  { iso: "GB", label: "UK", dial: "+44" },
  { iso: "AU", label: "Australia", dial: "+61" },
  { iso: "DE", label: "Germany", dial: "+49" },
  { iso: "FR", label: "France", dial: "+33" },
  { iso: "ES", label: "Spain", dial: "+34" },
  { iso: "IT", label: "Italy", dial: "+39" },
  { iso: "MX", label: "Mexico", dial: "+52" },
  { iso: "BR", label: "Brazil", dial: "+55" },
  { iso: "IN", label: "India", dial: "+91" },
  { iso: "PL", label: "Poland", dial: "+48" },
  { iso: "RU", label: "Russia", dial: "+7" },
  { iso: "UA", label: "Ukraine", dial: "+380" },
];

/** Форматирует число как его набирают (маска "(999) 999-9999" для US) */
function formatAsTyped(digits: string, region: CountryCode): string {
  return new AsYouType(region).input(digits);
}

export function OnboardingFlow({ initial }: { initial: OnboardingInitial }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [displayName, setDisplayName] = useState(initial.display_name ?? "");
  const [username, setUsername] = useState(initial.username ?? "");
  const [usernameState, setUsernameState] = useState<UsernameState>({
    status: initial.username ? "available" : "idle",
  });
  const [avatarUrl, setAvatarUrl] = useState(initial.avatar_url ?? "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [phoneRegion, setPhoneRegion] = useState<CountryCode>("US");
  const [phoneValue, setPhoneValue] = useState(() => {
    if (!initial.phone_number) return "";
    const parsed = parsePhoneNumberFromString(initial.phone_number);
    if (parsed) setPhoneRegion(parsed.country ?? "US");
    return parsed ? parsed.formatNational() : initial.phone_number;
  });

  const [venmo, setVenmo] = useState(initial.venmo_username ?? "");
  const [cashTag, setCashTag] = useState(initial.cash_tag ?? "");
  const [zelle, setZelle] = useState(initial.zelle_email ?? "");
  const [zellePhone, setZellePhone] = useState(initial.zelle_phone ?? "");
  const [saving, setSaving] = useState(false);

  // Телефон: валидность + E.164
  const phoneParsed = useMemo(
    () => parsePhoneNumberFromString(phoneValue, phoneRegion),
    [phoneValue, phoneRegion]
  );
  const phoneValid = Boolean(phoneParsed && phoneParsed.isValid());
  const phoneE164 = phoneParsed && phoneParsed.isValid() ? phoneParsed.format("E.164") : null;

  const zellePhoneParsed = useMemo(() => {
    const raw = zellePhone.trim();
    if (!raw) return undefined;
    return parsePhoneNumberFromString(raw, phoneRegion);
  }, [zellePhone, phoneRegion]);
  const zellePhoneValid = !zellePhone.trim() || Boolean(zellePhoneParsed?.isValid());
  const zellePhoneE164 =
    zellePhoneParsed && zellePhoneParsed.isValid()
      ? zellePhoneParsed.format("E.164")
      : null;

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

  const handlePhoneChange = (raw: string) => {
    const digits = raw.replace(/[^\d]/g, "");
    setPhoneValue(formatAsTyped(digits, phoneRegion));
  };

  const handleRegionChange = (iso: string) => {
    const region = iso as CountryCode;
    const digits = phoneValue.replace(/[^\d]/g, "");
    setPhoneRegion(region);
    setPhoneValue(formatAsTyped(digits, region));
  };

  const canContinueIdentity =
    displayName.trim().length > 0 &&
    usernameState.status === "available" &&
    phoneValid &&
    !uploadingAvatar;

  const hasAnyHandle = Boolean(
    venmo.trim() || cashTag.trim() || zelle.trim() || zellePhone.trim()
  );
  const canContinueHandles = hasAnyHandle && zellePhoneValid;

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

  const handleSubmit = async () => {
    if (saving || !phoneE164) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        username: username.trim(),
        display_name: displayName.trim(),
        avatar_url: avatarUrl,
        phone_number: phoneE164,
        venmo_username: venmo.trim().replace(/^@/, ""),
        cash_tag: cashTag.trim().replace(/^\$/, ""),
        zelle_email: zelle.trim(),
        onboarding_completed: true,
      };
      if (zellePhoneE164) body.zelle_phone = zellePhoneE164;

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

      toast.success(`Welcome to SubSplit, ${username.trim()}!`);
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Network error, please try again");
    } finally {
      setSaving(false);
    }
  };

  const stepTitle: Record<1 | 2 | 3, string> = {
    1: "Set up your profile",
    2: "How will friends pay you?",
    3: "Ready to go?",
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {stepTitle[step]}
          </h1>
          <p className="text-sm text-muted-foreground">
            {step === 1 &&
              "Friends will see your name, username and photo in groups."}
            {step === 2 &&
              "Add at least one way for group members to pay you back."}
            {step === 3 && "Check everything looks right before we start."}
          </p>
        </div>
        <span className="text-xs text-muted-foreground">
          Step {step} of 3
        </span>
      </div>

      {step === 1 && (
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
                onClick={() =>
                  document.getElementById("avatar-input")?.click()
                }
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
            {usernameState.status === "taken" && (
              <p className="text-xs text-destructive">{usernameState.message}</p>
            )}
            {usernameState.status === "invalid" && (
              <p className="text-xs text-destructive">
                {usernameState.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Friends can invite you to groups by username. It&apos;s public.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">Phone number</Label>
            <div className="flex gap-2">
              <Select value={phoneRegion} onValueChange={handleRegionChange}>
                <SelectTrigger
                  id="phone-region"
                  className="h-10 w-[110px] shrink-0"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PHONE_COUNTRIES.map((c) => (
                    <SelectItem key={c.iso} value={c.iso}>
                      <span className="inline-flex w-full items-center justify-between gap-4">
                        <span>{c.label}</span>
                        <span className="text-muted-foreground">{c.dial}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative min-w-0 flex-1">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                  {PHONE_COUNTRIES.find((c) => c.iso === phoneRegion)?.dial}
                </span>
                <Input
                  id="phone"
                  inputMode="tel"
                  placeholder="(999) 999-9999"
                  value={phoneValue}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className={cn(
                    "h-10 pl-12 pr-9",
                    phoneValue && phoneValid &&
                      "border-emerald-500/60 focus-visible:ring-emerald-500/30"
                  )}
                />
                {phoneValue && phoneValid && (
                  <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600" />
                )}
              </div>
            </div>
            {phoneValue && !phoneValid && (
              <p className="text-xs text-destructive">
                Enter a valid phone number
              </p>
            )}
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Phone className="h-3 w-3 shrink-0" />
              Used for payment reminders and group invites. We never share it.
            </p>
          </div>

          <Button
            className="w-full"
            disabled={!canContinueIdentity}
            onClick={() => setStep(2)}
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <p className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2.5 text-sm">
            <Sparkles className="h-4 w-4 shrink-0 text-primary" />
            Your friends need this to pay you back. You can update these later
            in Settings.
          </p>

          <div className="space-y-4">
            <div className="grid gap-1.5">
              <Label htmlFor="venmo" className="text-xs text-muted-foreground">
                Venmo username
              </Label>
              <Input
                id="venmo"
                value={venmo}
                onChange={(e) => setVenmo(e.target.value.trimStart())}
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
                onChange={(e) => setCashTag(e.target.value.trimStart())}
                placeholder="$yourcashtag"
                className="h-10"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="zelle" className="text-xs text-muted-foreground">
                Zelle email
              </Label>
              <Input
                id="zelle"
                type="email"
                value={zelle}
                onChange={(e) => setZelle(e.target.value)}
                placeholder="you@bank.com"
                className="h-10"
              />
            </div>
            <div className="grid gap-1.5">
              <Label
                htmlFor="zelle-phone"
                className="text-xs text-muted-foreground"
              >
                Zelle phone number
              </Label>
              <Input
                id="zelle-phone"
                inputMode="tel"
                value={zellePhone}
                onChange={(e) => setZellePhone(e.target.value.replace(/\s+/g, "").replace(/[^\d+]/g, ""))}
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

          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              className="shrink-0"
              onClick={() => setStep(1)}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
            <Button
              className="w-full"
              disabled={!canContinueHandles}
              onClick={() => setStep(3)}
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div className="rounded-xl border p-4">
            <div className="mb-4 flex items-center gap-3">
              <Avatar className="h-12 w-12">
                {avatarUrl && (
                  <AvatarImage src={avatarUrl} alt={displayName || "Avatar"} />
                )}
                <AvatarFallback>{initials(displayName || "?")}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium leading-tight">{displayName}</p>
                <p className="text-sm text-muted-foreground">@{username}</p>
              </div>
            </div>

            <dl className="grid gap-2 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Phone</dt>
                <dd className="font-medium">
                  {phoneE164
                    ? parsePhoneNumberFromString(phoneE164)?.formatInternational() ??
                      phoneE164
                    : "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Venmo</dt>
                <dd className="font-medium text-right">
                  {venmo.trim() ? `@${venmo.trim().replace(/^@/, "")}` : "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Cash App</dt>
                <dd className="font-medium text-right">
                  {cashTag.trim() ? `$${cashTag.trim().replace(/^\$/, "")}` : "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Zelle</dt>
                <dd className="font-medium text-right">
                  {zelle.trim()
                    ? zelle.trim()
                    : zellePhone.trim()
                      ? zellePhoneE164 ??
                        parsePhoneNumberFromString(zellePhone, phoneRegion)?.formatInternational() ??
                        zellePhone.trim()
                      : "—"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              className="shrink-0"
              onClick={() => setStep(2)}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
            <Button
              className="w-full"
              disabled={saving}
              onClick={() => void handleSubmit()}
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              {saving ? "Creating…" : "Create My Profile"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
