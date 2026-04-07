"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Step = {
  label: string;
  icon: string;
  durationMs: number;
};

const STEPS: Step[] = [
  { label: "이력서 텍스트 추출 중", icon: "text_snippet", durationMs: 3_000 },
  { label: "핵심 경험 분석 중", icon: "search_insights", durationMs: 6_000 },
  { label: "직무 역량 매칭 중", icon: "link", durationMs: 8_000 },
  { label: "맞춤 질문 설계 중", icon: "psychology", durationMs: 25_000 },
  { label: "출제 확률 계산 중", icon: "calculate", durationMs: 25_000 },
  { label: "모범 답안 생성 중", icon: "auto_fix_high", durationMs: 50_000 },
];

const TOTAL_DURATION = STEPS.reduce((sum, s) => sum + s.durationMs, 0);

const TIPS = [
  "STAR 기법으로 답변하면 면접관에게 좋은 인상을 줄 수 있어요.",
  "기술 질문에는 '왜 그 기술을 선택했는지'를 함께 설명해 보세요.",
  "경험을 이야기할 때 구체적인 수치를 포함하면 설득력이 높아져요.",
  "면접에서는 모르는 것을 솔직히 인정하는 것도 좋은 전략이에요.",
  "포트폴리오 프로젝트의 트레이드오프를 설명할 수 있으면 좋아요.",
];

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

  if (!isActive) return { step: 0, progress: 0 };
  return snapshot;
}

function useTipRotation(isActive: boolean) {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    if (!isActive) return;
    setTipIndex(Math.floor(Math.random() * TIPS.length));
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 8_000);
    return () => clearInterval(interval);
  }, [isActive]);

  return TIPS[tipIndex];
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
  const tip = useTipRotation(isActive);

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

        <div className="space-y-3">
          {STEPS.map((step, i) => {
            const isDone = isComplete || i < currentStep;
            const isCurrent = !isComplete && i === currentStep;

            return (
              <div key={step.label} className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full transition-colors",
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
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-muted/50 p-2.5">
              <span className="material-symbols-outlined mt-0.5 text-sm text-primary">
                lightbulb
              </span>
              <p className="text-xs leading-relaxed text-muted-foreground transition-opacity duration-500">
                {tip}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
