"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { apiErrorMessageAsync } from "@/lib/client-errors";
import { Button } from "@/components/ui/button";

export function AcceptInviteButton({ token }: { token: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const accept = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/invites/${token}`, { method: "POST" });
      const json = (await res.json().catch(() => null)) as {
        error?: { message?: string };
        data?: { group_id?: string };
      } | null;

      if (!res.ok) {
        toast.error(await apiErrorMessageAsync(res, json?.error?.message ?? "Failed to accept invitation"));
        return;
      }

      toast.success("Invitation accepted! Welcome to the group");
      router.push(`/groups/${json?.data?.group_id ?? ""}`);
      router.refresh();
    } catch {
      toast.error("Network error, please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button size="lg" onClick={accept} disabled={loading} className="w-full sm:w-auto">
      <CheckCircle2 className="h-4 w-4" />
      {loading ? "Accepting…" : "Accept invitation"}
    </Button>
  );
}
