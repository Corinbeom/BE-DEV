"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { useAuth } from "@/features/auth/hooks/useAuth";

function ServerWarmingSplash({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background-light dark:bg-background-dark">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/30">
        <span className="material-symbols-outlined animate-spin text-3xl">
          progress_activity
        </span>
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          서버가 시작되고 있습니다
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          첫 접속 시 30~60초 정도 소요될 수 있어요.
        </p>
      </div>
      <div className="h-1 w-48 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div className="animate-progress-indeterminate h-full rounded-full bg-primary" />
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="mt-2 text-sm font-medium text-slate-400 transition-colors hover:text-primary"
      >
        취소
      </button>
    </div>
  );
}

function ServerErrorSplash({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background-light dark:bg-background-dark">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-red-500 text-white shadow-lg shadow-red-500/30">
        <span className="material-symbols-outlined text-3xl">cloud_off</span>
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          서버에 연결할 수 없습니다
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          잠시 후 다시 시도해 주세요.
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-primary/90"
      >
        다시 연결
      </button>
    </div>
  );
}

export function AppFrame({ children }: { children: ReactNode }) {
  const { user, isLoading, serverStatus, retryConnection } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && serverStatus === "ready" && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, serverStatus, router]);

  if (serverStatus === "warming" || serverStatus === "checking") {
    return <ServerWarmingSplash onRetry={retryConnection} />;
  }

  if (serverStatus === "error") {
    return <ServerErrorSplash onRetry={retryConnection} />;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">
          progress_activity
        </span>
      </div>
    );
  }

  if (!user) return null;

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
