"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNav } from "./nav";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const displayName = user?.displayName ?? user?.email ?? "사용자";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <aside className="hidden w-72 flex-shrink-0 flex-col border-r border-border bg-sidebar md:flex">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5">
        <Image
          src="/logos/BeDevLogo.png"
          alt="Be Dev"
          width={44}
          height={44}
          className="rounded-xl shadow-md dark:invert"
          priority
        />
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">
            Be Dev
          </h1>
          <p className="text-[11px] font-medium text-muted-foreground">
            AI Career Platform
          </p>
        </div>
      </div>

      <div className="px-6"><Separator /></div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {primaryNav.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                buttonVariants({ variant: active ? "secondary" : "ghost", size: "default" }),
                "w-full justify-start gap-3 h-10 px-3 text-sm font-medium transition-all",
                active
                  ? "bg-primary/10 text-primary font-semibold shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <span
                className={cn(
                  "material-symbols-outlined text-[20px]",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-6"><Separator /></div>

      {/* User Profile Area */}
      <div className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "flex w-full items-center gap-3 rounded-xl p-2.5 transition-all",
              "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActivePath(pathname, "/profile") && "bg-primary/10"
            )}
          >
            <Avatar className="size-9 border-2 border-primary/20">
              <AvatarImage src={user?.photoUrl ?? undefined} alt={displayName} />
              <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
                {initial}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-semibold text-foreground">
                {displayName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user?.email}
              </p>
            </div>
            <span className="material-symbols-outlined text-lg text-muted-foreground">
              unfold_more
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem
              onClick={() => window.location.href = "/profile"}
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
