"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AudioLines, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SidebarNav } from "./sidebar-nav";

function Brand() {
  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-2 rounded-md text-sm font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <AudioLines className="size-4 text-brand" />
      Meeting Scribe
    </Link>
  );
}

export function DashboardShell({
  userMenu,
  children,
}: {
  userMenu: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // The phone menu remembers the page it was opened on, so it closes by
  // itself as soon as the user navigates somewhere else.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const isOpen = openedOn === pathname;
  const close = () => setOpenedOn(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenedOn(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  return (
    <div className="min-h-screen md:flex [--ring:var(--brand)]">
      {/* Phone-only bar that holds the menu button */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur md:hidden">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open menu"
          aria-expanded={isOpen}
          aria-controls="dashboard-sidebar"
          onClick={() => setOpenedOn(pathname)}
        >
          <Menu />
        </Button>
        <Brand />
      </header>

      {/* Dimmed backdrop behind the phone menu */}
      <div
        aria-hidden
        onClick={close}
        className={cn(
          "fixed inset-0 z-40 bg-foreground/20 transition-opacity md:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        id="dashboard-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-background transition-[transform,visibility] duration-200",
          "md:sticky md:top-0 md:z-auto md:h-screen md:translate-x-0 md:bg-muted/40 md:visible",
          isOpen ? "translate-x-0" : "invisible -translate-x-full",
        )}
      >
        <div className="flex h-14 items-center justify-between px-5">
          <Brand />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close menu"
            className="md:hidden"
            onClick={close}
          >
            <X />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <SidebarNav />
        </div>
        <div className="border-t p-3">{userMenu}</div>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-10 md:px-10 md:py-14">
          {children}
        </div>
      </main>
    </div>
  );
}
