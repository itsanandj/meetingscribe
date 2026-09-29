import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { NavUser, NavUserSkeleton } from "@/components/dashboard/nav-user";
import { EnvVarWarning } from "@/components/env-var-warning";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";
import { Suspense } from "react";

async function CurrentNavUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  return <NavUser email={data?.claims?.email ?? ""} />;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider className="[--ring:var(--brand)]">
      <AppSidebar
        footer={
          !hasEnvVars ? (
            <EnvVarWarning />
          ) : (
            <Suspense fallback={<NavUserSkeleton />}>
              <CurrentNavUser />
            </Suspense>
          )
        }
      />
      <SidebarInset>
        <DashboardHeader />
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-10 md:px-10 md:py-12">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
