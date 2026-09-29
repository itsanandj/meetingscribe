"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { AudioLines, List, Upload } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

const navItems = [
  { href: "/dashboard/meetings", label: "Meetings", icon: List },
  { href: "/dashboard/upload", label: "Upload", icon: Upload },
];

function NavLinks({ activeHref }: { activeHref?: string }) {
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarMenu>
      {navItems.map(({ href, label, icon: Icon }) => (
        <SidebarMenuItem key={href}>
          <SidebarMenuButton
            asChild
            tooltip={label}
            isActive={href === activeHref}
            className="data-[active=true]:bg-brand/10 data-[active=true]:text-brand"
          >
            <Link href={href} onClick={() => setOpenMobile(false)}>
              <Icon />
              <span>{label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

// Reading the URL can suspend on pages like /dashboard/meetings/[id], so only
// the highlight waits for it; the links show straight away.
function ActiveNavLinks() {
  const pathname = usePathname();
  const active = navItems.find(
    ({ href }) => pathname === href || pathname.startsWith(`${href}/`),
  );
  return <NavLinks activeHref={active?.href} />;
}

export function AppSidebar({ footer }: { footer: React.ReactNode }) {
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard" onClick={() => setOpenMobile(false)}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-brand text-brand-foreground">
                  <AudioLines className="size-4" />
                </div>
                <span className="font-semibold tracking-tight">
                  Meeting Scribe
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <Suspense fallback={<NavLinks />}>
              <ActiveNavLinks />
            </Suspense>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>{footer}</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
