"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CreditCard, Gem, LogOut, Mail, User as UserIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createBrowserClientInstance } from "@/lib/supabase/client";

export function ProfileContent({
  user,
}: {
  user: { display_name: string | null; email: string; subscription_tier: "free" | "pro" };
}) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    const supabase = createBrowserClientInstance();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Профиль</h1>
        <p className="text-sm text-muted-foreground">
          Данные аккаунта и тариф
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserIcon className="h-4 w-4" /> Аккаунт
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Имя</span>
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
            <span className="text-muted-foreground">Тариф</span>
            <Badge variant={user.subscription_tier === "pro" ? "default" : "secondary"}>
              {user.subscription_tier === "pro" ? "Pro" : "Free"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Gem className="h-4 w-4" /> Тариф
          </CardTitle>
          <CardDescription>
            На Free доступно 3 подписки и до 2 человек в группе. Pro снимает
            ограничения.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full">
            <Link href="/pricing">
              <CreditCard className="h-4 w-4" />
              {user.subscription_tier === "pro" ? "Управление тарифом" : "Перейти на Pro"}
            </Link>
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
        {signingOut ? "Выход…" : "Выйти из аккаунта"}
      </Button>
    </div>
  );
}
