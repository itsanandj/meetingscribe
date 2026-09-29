"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";

const pageTitles: Record<string, string> = {
  "/dashboard/meetings": "Meetings",
  "/dashboard/upload": "Upload",
  "/dashboard/billing": "Billing",
  "/dashboard/settings": "Settings",
};

export function DashboardHeader() {
  const pathname = usePathname();

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <span className="text-sm font-medium">{pageTitles[pathname] ?? ""}</span>
    </header>
  );
}
