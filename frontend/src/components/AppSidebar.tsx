"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNav } from "./nav";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const displayName = user?.displayName ?? user?.email ?? "사용자";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <aside className="hidden w-[220px] flex-shrink-0 flex-col bg-sidebar md:flex">
      {/* Logo — Blade style text mark */}
      <div className="px-5 pb-[18px] pt-[22px]">
        <div className="font-sans text-lg font-bold tracking-[-0.02em] text-sidebar-foreground">
          Bluehour
        </div>
        <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-sidebar-foreground/30">
          Before Your Sunrise
        </div>
      </div>

      <div className="mx-5 h-px bg-sidebar-border" />

      {/* Navigation */}
      <nav className="flex-1 px-2.5 py-3">
        {primaryNav.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative mb-0.5 flex w-full items-center gap-2.5 px-2.5 py-[9px] text-[13px] transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sidebar-ring",
                active
                  ? "bg-sidebar-accent font-medium text-sidebar-foreground"
                  : "text-sidebar-foreground/45 hover:bg-white/[0.05] hover:text-sidebar-foreground"
              )}
            >
              {/* Active indicator bar */}
              {active && (
                <div className="absolute inset-y-0 left-0 w-[3px] rounded-r bg-sidebar-primary" />
              )}
              <span
                className={cn(
                  "material-symbols-outlined text-[17px]",
                  active ? "text-sidebar-foreground" : "text-sidebar-foreground/35"
                )}
                style={{
                  fontVariationSettings: active
                    ? '"FILL" 1, "wght" 400, "GRAD" 0, "opsz" 24'
                    : '"FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24',
                }}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mx-5 h-px bg-sidebar-border" />

      {/* User profile */}
      <div className="p-3.5">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-lg p-2 transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
            <Avatar className="size-[26px] flex-shrink-0 border border-sidebar-foreground/20">
              <AvatarImage src={user?.photoUrl ?? undefined} alt={displayName} />
              <AvatarFallback className="bg-sidebar-primary/25 text-[11px] font-bold text-sidebar-primary">
                {initial}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-[12px] font-semibold text-sidebar-foreground">
                {displayName}
              </p>
              <p className="truncate text-[10px] text-sidebar-foreground/35">
                {user?.email}
              </p>
            </div>
            <span className="material-symbols-outlined text-base text-sidebar-foreground/30">
              unfold_more
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem
              onClick={() => (window.location.href = "/profile")}
              className="flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">person</span>
              프로필 관리
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="text-destructive focus:text-destructive"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
