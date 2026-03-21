"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { apiBaseUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function LoginPage() {
  const { user, isLoading, serverStatus, retryConnection } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  if (serverStatus === "warming" || serverStatus === "checking") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-br from-background via-background to-primary/5">
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
      </div>
    );
  }

  if (serverStatus === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-destructive text-white shadow-lg shadow-destructive/25">
          <span className="material-symbols-outlined text-3xl">cloud_off</span>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground">
            서버에 연결할 수 없습니다
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            잠시 후 다시 시도해 주세요.
          </p>
        </div>
        <Button onClick={retryConnection}>다시 연결</Button>
      </div>
    );
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

  if (user) return null;

  const backendUrl = apiBaseUrl();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-40 -right-40 size-[500px] rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 size-[400px] rounded-full bg-primary/8 blur-3xl" />

      <Card className="relative w-full max-w-sm border-border/50 shadow-2xl shadow-primary/5">
        <CardContent className="p-8">
          {/* Logo */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
              <span className="material-symbols-outlined text-3xl">
                terminal
              </span>
            </div>
            <h1 className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">
              Be Dev
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              AI 기반 취업 준비 플랫폼
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              className="h-12 gap-3 text-sm font-semibold transition-all hover:shadow-md hover:border-primary/30"
              onClick={() => {
                window.location.href = `${backendUrl}/oauth2/authorization/google`;
              }}
            >
              <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google로 로그인
            </Button>

            <Button
              className="h-12 gap-3 border-[#FEE500] bg-[#FEE500] text-sm font-semibold text-[#3C1E1E] shadow-sm transition-all hover:bg-[#FDD800] hover:shadow-md"
              onClick={() => {
                window.location.href = `${backendUrl}/oauth2/authorization/kakao`;
              }}
            >
              <svg
                className="size-5"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.584 1.522 4.857 3.814 6.218L4.7 20.5a.5.5 0 0 0 .746.434l4.686-2.762A11.5 11.5 0 0 0 12 18c5.523 0 10-3.477 10-7.5S17.523 3 12 3z" />
              </svg>
              카카오로 로그인
            </Button>
          </div>
        </CardContent>

        <Separator />

        <CardFooter className="justify-center p-4">
          <p className="text-center text-xs text-muted-foreground">
            로그인하면 서비스 이용약관과 개인정보처리방침에 동의하게 됩니다.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
