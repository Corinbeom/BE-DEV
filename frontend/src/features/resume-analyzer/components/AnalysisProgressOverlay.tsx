"use client";

import { useEffect, useState } from "react";

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

export function AnalysisProgressOverlay({
  isActive,
  isComplete,
}: {
  isActive: boolean;
  isComplete: boolean;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setCurrentStep(0);
      setElapsedMs(0);
      return;
    }

    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      setElapsedMs(elapsed);

      let accumulated = 0;
      for (let i = 0; i < STEPS.length; i++) {
        accumulated += STEPS[i].durationMs;
        if (elapsed < accumulated) {
          setCurrentStep(i);
          return;
        }
      }
      setCurrentStep(STEPS.length - 1);
    }, 200);

    return () => clearInterval(interval);
  }, [isActive]);

  if (!isActive && !isComplete) return null;

  const totalDuration = STEPS.reduce((sum, s) => sum + s.durationMs, 0);
  const progress = isComplete ? 100 : Math.min((elapsedMs / totalDuration) * 100, 95);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-primary/10 bg-white p-8 shadow-2xl dark:border-white/10 dark:bg-slate-900">
        <div className="mb-6 text-center">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {isComplete ? "분석 완료!" : "이력서를 분석하고 있어요"}
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
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
                  className={[
                    "flex size-8 items-center justify-center rounded-full transition-colors",
                    isDone
                      ? "bg-green-500 text-white"
                      : isCurrent
                        ? "bg-primary text-white"
                        : "bg-slate-100 text-slate-400 dark:bg-white/10",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "material-symbols-outlined text-sm",
                      isCurrent ? "animate-spin" : "",
                    ].join(" ")}
                  >
                    {isDone ? "check" : isCurrent ? "progress_activity" : step.icon}
                  </span>
                </div>
                <span
                  className={[
                    "text-sm font-medium",
                    isDone
                      ? "text-green-600 dark:text-green-400"
                      : isCurrent
                        ? "text-slate-900 dark:text-white"
                        : "text-slate-400 dark:text-slate-500",
                  ].join(" ")}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>진행률</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          {!isComplete && (
            <p className="mt-2 text-center text-xs text-slate-400 dark:text-slate-500">
              예상 소요 시간: 약 60~90초
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
