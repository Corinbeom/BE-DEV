"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Step = {
  label: string;
  icon: string;
  durationMs: number;
};

const STEPS: Step[] = [
  { label: "파일 업로드 중", icon: "cloud_upload", durationMs: 3_000 },
  { label: "텍스트 추출 중", icon: "text_snippet", durationMs: 5_000 },
  { label: "AI 질문 생성 중", icon: "psychology", durationMs: 60_000 },
];

const TOTAL_DURATION = STEPS.reduce((sum, s) => sum + s.durationMs, 0);

function computeStep(elapsedMs: number) {
  let accumulated = 0;
  for (let i = 0; i < STEPS.length; i++) {
    accumulated += STEPS[i].durationMs;
    if (elapsedMs < accumulated) return i;
  }
  return STEPS.length - 1;
}

function useElapsedTimer(isActive: boolean) {
  const [snapshot, setSnapshot] = useState({ step: 0, progress: 0 });
  const startRef = useRef(0);

  useEffect(() => {
    if (!isActive) {
      startRef.current = 0;
      return;
    }

    startRef.current = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      setSnapshot({
        step: computeStep(elapsed),
        progress: Math.min((elapsed / TOTAL_DURATION) * 100, 95),
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isActive]);

  // When inactive, always return zeroed snapshot
  if (!isActive) return { step: 0, progress: 0 };
  return snapshot;
}

export function AnalysisProgressOverlay({
  isActive,
  isComplete,
}: {
  isActive: boolean;
  isComplete: boolean;
}) {
  const { step: currentStep, progress: timerProgress } =
    useElapsedTimer(isActive);
  const progress = isComplete ? 100 : timerProgress;

  if (!isActive && !isComplete) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-background p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <h3 className="text-lg font-bold text-foreground">
            {isComplete ? "분석 완료!" : "이력서를 분석하고 있어요"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {isComplete
              ? "질문이 생성되었습니다."
              : "AI가 맞춤형 면접 질문을 생성하고 있습니다."}
          </p>
        </div>

        <div className="space-y-4">
          {STEPS.map((step, i) => {
            const isDone = isComplete || i < currentStep;
            const isCurrent = !isComplete && i === currentStep;

            return (
              <div key={step.label} className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full transition-colors",
                    isDone
                      ? "bg-emerald-500 text-white"
                      : isCurrent
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "material-symbols-outlined text-sm",
                      isCurrent && "animate-spin"
                    )}
                  >
                    {isDone
                      ? "check"
                      : isCurrent
                        ? "progress_activity"
                        : step.icon}
                  </span>
                </div>
                <span
                  className={cn(
                    "text-sm font-medium",
                    isDone
                      ? "text-emerald-600 dark:text-emerald-400"
                      : isCurrent
                        ? "text-foreground"
                        : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>진행률</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          {!isComplete && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              예상 소요 시간: 약 60~90초
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
