"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10">
            <span className="material-symbols-outlined text-3xl text-destructive">
              error
            </span>
          </div>
          <h1 className="text-xl font-bold text-foreground">
            문제가 발생했습니다
          </h1>
          <p className="text-sm text-muted-foreground">
            {error.message || "예상치 못한 오류가 발생했습니다."}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={reset}>
              다시 시도
            </Button>
            <Link href="/dashboard" className={buttonVariants()}>
              대시보드로 이동
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
