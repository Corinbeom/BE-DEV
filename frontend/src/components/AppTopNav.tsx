"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "대시보드" },
  { href: "/interview-practice", label: "면접 연습" },
  { href: "/resume-analyzer", label: "이력서/포트폴리오" },
  { href: "/question-bank", label: "문제 은행" },
];

export function AppTopNav() {
  const pathname = usePathname();

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-primary/10 bg-white px-10 py-3">
      <div className="flex items-center gap-4 text-primary">
        <div className="size-6">
          <span className="material-symbols-outlined text-3xl">
            auto_awesome
          </span>
        </div>
        <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] text-[#111118]">
          PrepPro AI
        </h2>
      </div>

      <div className="flex flex-1 justify-end gap-8">
        <nav className="flex items-center gap-9">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  isActive
                    ? "border-b-2 border-primary pb-1 text-sm font-bold text-primary"
                    : "text-sm font-medium text-[#111118] transition-colors hover:text-primary"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex gap-2">
          <button
            type="button"
            className="flex size-10 cursor-pointer items-center justify-center rounded-lg bg-primary/10 text-primary"
            aria-label="알림"
          >
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button
            type="button"
            className="flex size-10 cursor-pointer items-center justify-center rounded-lg bg-primary/10 text-primary"
            aria-label="계정"
          >
            <span className="material-symbols-outlined">account_circle</span>
          </button>
        </div>
      </div>
    </header>
  );
}


