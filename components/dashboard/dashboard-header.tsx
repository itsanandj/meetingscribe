"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

const pageTitles: Record<string, string> = {
  "/dashboard/meetings": "Meetings",
  "/dashboard/upload": "Upload",
  "/dashboard/billing": "Billing",
  "/dashboard/settings": "Settings",
};

function PageTitle() {
  const pathname = usePathname();

  return (
    <span className="text-sm font-medium">
      {pageTitles[pathname] ??
        (pathname.startsWith("/dashboard/meetings/") ? "Meeting" : "")}
    </span>
  );
}

export function DashboardHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Suspense>
        <PageTitle />
      </Suspense>
    </header>
  );
}
