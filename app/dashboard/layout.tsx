import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { UserMenu, UserMenuSkeleton } from "@/components/dashboard/user-menu";
import { EnvVarWarning } from "@/components/env-var-warning";
import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";
import { Suspense } from "react";

async function CurrentUserMenu() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  return <UserMenu email={data?.claims?.email ?? ""} />;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell
      userMenu={
        !hasEnvVars ? (
          <EnvVarWarning />
        ) : (
          <Suspense fallback={<UserMenuSkeleton />}>
            <CurrentUserMenu />
          </Suspense>
        )
      }
    >
      {children}
    </DashboardShell>
  );
}
