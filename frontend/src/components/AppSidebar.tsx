"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNav } from "./nav";

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function AppSidebar() {
  const pathname = usePathname();

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

        <div className="mt-4 border-t border-slate-100 pt-4 dark:border-white/5">
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5"
          >
            <span className="material-symbols-outlined">settings</span>
            <span className="text-sm">설정</span>
          </Link>
        </div>
      </nav>

      <div className="border-t border-slate-100 p-4 dark:border-white/5">
        <div className="flex cursor-pointer items-center gap-3 rounded-xl p-2 transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
          <div className="size-10 rounded-full bg-slate-200" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">Alex Rivera</p>
            <p className="truncate text-xs text-slate-500">Software Engineer</p>
          </div>
          <span className="material-symbols-outlined text-sm text-slate-400">
            unfold_more
          </span>
        </div>
      </div>
    </aside>
  );
}


