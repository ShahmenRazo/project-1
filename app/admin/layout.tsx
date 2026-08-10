import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminNav, AdminNavMobile } from "@/components/admin/admin-nav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("users")
    .select("role, email")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 flex-col border-r bg-muted/30 md:flex">
        <div className="flex h-16 items-center gap-2 border-b px-4">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span className="font-semibold">SubSplit Admin</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          <AdminNav />
        </nav>
        <div className="border-t p-3">
          <a href="/dashboard" className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted">
            ← Back to app
          </a>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="flex h-14 items-center justify-between gap-2 border-b px-4 md:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">SubSplit Admin</span>
          </div>
          <a
            href="/dashboard"
            className="shrink-0 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            ← Back to app
          </a>
        </div>
        <div className="border-b bg-muted/30 px-2 py-1 md:hidden">
          <AdminNavMobile />
        </div>
        <main className="min-w-0 px-4 py-6 md:px-6 md:py-8">{children}</main>
      </div>
    </div>
  );
}
