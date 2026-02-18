import type { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";

export function AppFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background-light text-slate-900 dark:bg-background-dark dark:text-slate-100">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark">
        <AppHeader />
        <div className="mx-auto max-w-7xl space-y-8 p-8">{children}</div>
      </main>
    </div>
  );
}


