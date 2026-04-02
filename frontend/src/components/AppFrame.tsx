"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function ServerWarmingSplash({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background">
      <Card className="w-full max-w-sm border-0 bg-transparent shadow-none">
        <CardContent className="flex flex-col items-center gap-6 pt-6">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
            <span className="material-symbols-outlined animate-spin text-3xl">
              progress_activity
            </span>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground">
              서버가 시작되고 있습니다
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              첫 접속 시 30~60초 정도 소요될 수 있어요.
            </p>
          </div>
          <div className="h-1.5 w-48 overflow-hidden rounded-full bg-muted">
            <div className="animate-progress-indeterminate h-full rounded-full bg-primary" />
          </div>
          <Button variant="ghost" size="sm" onClick={onRetry}>
            취소
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ServerErrorSplash({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background">
      <Card className="w-full max-w-sm border-0 bg-transparent shadow-none">
        <CardContent className="flex flex-col items-center gap-6 pt-6">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-destructive text-white shadow-lg shadow-destructive/25">
            <span className="material-symbols-outlined text-3xl">
              cloud_off
            </span>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground">
              서버에 연결할 수 없습니다
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              잠시 후 다시 시도해 주세요.
            </p>
          </div>
          <Button onClick={onRetry}>다시 연결</Button>
        </CardContent>
      </Card>
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

  if (serverStatus === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">
          progress_activity
        </span>
      </div>
    );
  }

  if (serverStatus === "warming") {
    return <ServerWarmingSplash onRetry={retryConnection} />;
  }

  if (serverStatus === "error") {
    return <ServerErrorSplash onRetry={retryConnection} />;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">
          progress_activity
        </span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <AppHeader />
        <div className="mx-auto max-w-7xl space-y-8 p-8">{children}</div>
      </main>
    </div>
  );
}
