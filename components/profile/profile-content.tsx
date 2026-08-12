"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AtSign,
  Camera,
  Check,
  CreditCard,
  Gem,
  Loader2,
  LogOut,
  Mail,
  Pencil,
  Phone,
  PiggyBank,
  User as UserIcon,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { apiErrorMessageAsync } from "@/lib/client-errors";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBrowserClientInstance } from "@/lib/supabase/client";
import { initials } from "@/lib/format";

export function ProfileContent({
  user,
}: {
  user: {
    display_name: string | null;
    email: string;
    username: string | null;
    avatar_url: string | null;
    phone_number: string | null;
    venmo_username: string | null;
    cash_tag: string | null;
    zelle_email: string | null;
    subscription_tier: "free" | "pro";
  };
}) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const [editingUsername, setEditingUsername] = useState(false);
  const [username, setUsername] = useState(user.username ?? "");
  const [savingUsername, setSavingUsername] = useState(false);

  const [venmo, setVenmo] = useState(user.venmo_username ?? "");
  const [cashTag, setCashTag] = useState(user.cash_tag ?? "");
  const [zelle, setZelle] = useState(user.zelle_email ?? "");
  const [savingHandles, setSavingHandles] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url ?? "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [phone, setPhone] = useState(user.phone_number ?? "");
  const [savingPhone, setSavingPhone] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    const supabase = createBrowserClientInstance();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

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

  const uploadAvatar = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setUploadingAvatar(true);
    try {
      const blob = await resizeImage(file);
      const supabase = createBrowserClientInstance();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) throw new Error("Not signed in");

      const path = `${authUser.id}/avatar.jpg`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
      if (error) throw error;

      const { data: publicUrl } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);
      const nextUrl = publicUrl.publicUrl;

      const res = await fetch("/api/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: nextUrl }),
      });
      const json = (await res.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      if (!res.ok) {
        toast.error(
          await apiErrorMessageAsync(
            res,
            json?.error?.message ?? "Failed to save avatar"
          )
        );
        return;
      }
      setAvatarUrl(nextUrl);
      toast.success("Photo updated");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload photo"
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const savePhone = async () => {
    setSavingPhone(true);
    try {
      const raw = phone.trim();
      const parsed = parsePhoneNumberFromString(
        raw.startsWith("+") ? raw : `+1${raw.replace(/[^\d]/g, "")}`
      );
      const body =
        parsed && parsed.isValid()
          ? { phone_number: parsed.format("E.164") }
          : { phone_number: raw };
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
            json?.error?.message ?? "Failed to save phone number"
          )
        );
        return;
      }
      toast.success("Phone number saved");
      router.refresh();
    } catch {
      toast.error("Network error, please try again");
    } finally {
      setSavingPhone(false);
    }
  };

  const saveUsername = async () => {
    const value = username.trim();
    if (!value) {
      toast.error("Username is required");
      return;
    }
    setSavingUsername(true);
    try {
      const res = await fetch("/api/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: value }),
      });
      const json = (await res.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      if (!res.ok) {
        toast.error(await apiErrorMessageAsync(res, json?.error?.message ?? "Failed to save username"));
        return;
      }
      toast.success("Username saved");
      setEditingUsername(false);
      router.refresh();
    } catch {
      toast.error("Network error, please try again");
    } finally {
      setSavingUsername(false);
    }
  };

  const saveHandles = async () => {
    setSavingHandles(true);
    try {
      const body: Record<string, string> = {};
      if (user.username) body.username = user.username;
      body.venmo_username = venmo.trim();
      body.cash_tag = cashTag.trim();
      body.zelle_email = zelle.trim();
      const res = await fetch("/api/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      if (!res.ok) {
        toast.error(await apiErrorMessageAsync(res, json?.error?.message ?? "Failed to save payment details"));
        return;
      }
      toast.success("Payment details saved");
      router.refresh();
    } catch {
      toast.error("Network error, please try again");
    } finally {
      setSavingHandles(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Account details and plan
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserIcon className="h-4 w-4" /> Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
              <AvatarFallback>
                {initials(user.display_name ?? user.email)}
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
                {uploadingAvatar && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Camera className="mr-2 h-4 w-4" />
                {avatarUrl ? "Change photo" : "Add photo"}
              </Button>
              {avatarUrl && (
                <button
                  type="button"
                  className="block text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setAvatarUrl("");
                    void (async () => {
                      const res = await fetch("/api/me", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ avatar_url: "" }),
                      });
                      if (res.ok) {
                        toast.success("Photo removed");
                        router.refresh();
                      }
                    })();
                  }}
                >
                  Remove
                </button>
              )}
              <input
                id="avatar-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadAvatar(file);
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">
              {user.display_name ?? "—"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Email</span>
            <span className="flex items-center gap-1.5 truncate font-medium">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              {user.email}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Username</span>
            {editingUsername ? (
              <div className="flex w-2/3 items-center gap-1.5">
                <AtSign className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="yourname"
                  className="h-8"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void saveUsername();
                    if (e.key === "Escape") setEditingUsername(false);
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => void saveUsername()}
                  disabled={savingUsername}
                  aria-label="Save username"
                >
                  {savingUsername ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 text-emerald-600" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => {
                    setEditingUsername(false);
                    setUsername(user.username ?? "");
                  }}
                  aria-label="Cancel"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                className="flex items-center gap-1.5 font-medium hover:underline"
                onClick={() => setEditingUsername(true)}
              >
                {user.username ? (
                  <>
                    <AtSign className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    {user.username}
                  </>
                ) : (
                  <span className="text-muted-foreground">Set username</span>
                )}
                <Pencil className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
            {!editingUsername && (
              <p className="text-xs text-muted-foreground">
                Friends can invite you by username
              </p>
            )}
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Plan</span>
            <Badge variant={user.subscription_tier === "pro" ? "default" : "secondary"}>
              {user.subscription_tier === "pro" ? "Pro" : "Free"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Gem className="h-4 w-4" /> Plan
          </CardTitle>
          <CardDescription>
            All features are free during beta. Pro is coming soon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Pro скрыт на время beta — вернётся с запуском Pro */}
          {/* <Button asChild variant="outline" className="w-full">
            <Link href="/pricing">
              <CreditCard className="h-4 w-4" />
              {user.subscription_tier === "pro" ? "Manage plan" : "Go Pro"}
            </Link>
          </Button> */}
          <p className="text-sm text-muted-foreground">
            All features are free during beta.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <PiggyBank className="h-4 w-4" /> Payment handles
          </CardTitle>
          <CardDescription>
            Friends use these to pay you when they owe money in a group.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
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
          <div className="grid gap-1.5">
            <Label htmlFor="phone" className="text-xs text-muted-foreground">
              Phone number (for reminders)
            </Label>
            <div className="flex gap-1.5">
              <span className="inline-flex h-10 items-center rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground">
                +1
              </span>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="h-10 flex-1"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void savePhone()}
              disabled={savingPhone || !phone.trim()}
              className="tap-active"
            >
              {savingPhone ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Phone className="mr-2 h-4 w-4" />
              )}
              {savingPhone ? "Saving…" : "Save phone"}
            </Button>
          </div>
          <Button
            onClick={() => void saveHandles()}
            disabled={savingHandles}
            className="tap-active w-full"
          >
            {savingHandles ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <PiggyBank className="mr-2 h-4 w-4" />
            )}
            {savingHandles ? "Saving…" : "Save payment details"}
          </Button>
        </CardContent>
      </Card>

      <Button
        variant="outline"
        className="w-full text-destructive hover:text-destructive"
        onClick={handleSignOut}
        disabled={signingOut}
      >
        <LogOut className="h-4 w-4" />
        {signingOut ? "Signing out…" : "Sign out"}
      </Button>
    </div>
  );
}
