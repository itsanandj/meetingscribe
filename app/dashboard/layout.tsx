import { DashboardNav } from "@/components/dashboard-nav";
import { EnvVarWarning } from "@/components/env-var-warning";
import { LogoutButton } from "@/components/logout-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";

async function UserEmail() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  return <span className="truncate">{data?.claims?.email}</span>;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-60 shrink-0 h-screen sticky top-0 flex flex-col gap-4 p-4 border-r border-r-foreground/10">
        <Link href="/dashboard" className="px-3 font-semibold">
          MeetingScribe
        </Link>
        <DashboardNav />
        <div className="mt-auto flex flex-col items-start gap-2 px-3 text-xs text-muted-foreground">
          {!hasEnvVars ? (
            <EnvVarWarning />
          ) : (
            <>
              <Suspense>
                <UserEmail />
              </Suspense>
              <div className="flex items-center gap-2">
                <LogoutButton />
                <ThemeSwitcher />
              </div>
            </>
          )}
        </div>
      </aside>
      <main className="flex-1 min-w-0 p-10">{children}</main>
    </div>
  );
}
