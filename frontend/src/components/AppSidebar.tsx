"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNav } from "./nav";
import { useAuth } from "@/features/auth/hooks/useAuth";

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const displayName = user?.displayName ?? user?.email ?? "사용자";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-primary/10 bg-white dark:bg-background-dark/50 md:flex">
      <div className="flex items-center gap-3 p-6">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-white">
          <span className="material-symbols-outlined">terminal</span>
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-primary">
            Be Dev
          </h1>
          <p className="text-xs font-medium text-slate-500">Premium Plan</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-4">
        {primaryNav.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                active
                  ? "flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-2.5 font-semibold text-primary"
                  : "flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5"
              }
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}

      </nav>

      <div className="border-t border-slate-100 p-4 dark:border-white/5">
        <div className="flex cursor-pointer items-center gap-3 rounded-xl p-2 transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {user?.photoUrl ? (
              <img
                src={user.photoUrl}
                alt={displayName}
                className="size-10 rounded-full object-cover"
              />
            ) : (
              initial
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{displayName}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10"
            aria-label="로그아웃"
            title="로그아웃"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
