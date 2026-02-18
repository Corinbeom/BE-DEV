import type { ReactNode } from "react";
import { AppTopNav } from "./AppTopNav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark">
      <div className="flex min-h-screen flex-col">
        <AppTopNav />
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-10 py-8">
          {children}
        </main>
        <footer className="mt-20 border-t border-slate-100 bg-white px-10 py-8">
          <div className="flex items-center justify-between opacity-60">
            <div className="flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined">auto_awesome</span>
              <span className="font-bold">PrepPro AI</span>
            </div>
            <p className="text-xs text-slate-500">
              © 2026 PrepPro AI. Built with precision for top-tier candidates.
            </p>
            <div className="flex gap-4">
              <a className="text-xs text-slate-500 hover:underline" href="#">
                개인정보 처리방침
              </a>
              <a className="text-xs text-slate-500 hover:underline" href="#">
                이용약관
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}


