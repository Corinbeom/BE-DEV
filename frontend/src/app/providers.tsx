"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ApiError } from "@/lib/api";
import {
  captureConsoleLogs,
  getRecentLogs,
  sendErrorReport,
} from "@/lib/discord";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    captureConsoleLogs();
  }, []);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            onError: (error) => {
              const message =
                error instanceof Error
                  ? error.message
                  : "요청 처리 중 오류가 발생했습니다.";
              const detail =
                error instanceof ApiError ? error.detail : undefined;
              toast.error(message, {
                action: {
                  label: "에러 리포트",
                  onClick: async () => {
                    const ok = await sendErrorReport({
                      message,
                      detail,
                      url: window.location.href,
                      userAgent: navigator.userAgent,
                      timestamp: new Date().toISOString(),
                      consoleLogs: getRecentLogs(),
                    });
                    if (ok) {
                      toast.success("에러 리포트가 전송되었습니다.");
                    } else {
                      toast.error("리포트 전송에 실패했습니다.");
                    }
                  },
                },
              });
            },
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
