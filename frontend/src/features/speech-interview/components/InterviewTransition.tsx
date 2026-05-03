"use client";

import { useEffect } from "react";

type Props = {
  currentIndex: number;
  totalQuestions: number;
  onDone: () => void;
};

export function InterviewTransition({ currentIndex, totalQuestions, onDone }: Props) {
  useEffect(() => {
    const timer = setTimeout(onDone, 1500);
    return () => clearTimeout(timer);
  }, [onDone]);

  const isLast = currentIndex + 1 >= totalQuestions;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined animate-spin text-2xl text-blue-400">progress_activity</span>
      </div>
      <p className="text-sm text-white/40">
        {isLast ? "마지막 답변을 저장하고 있습니다..." : `다음 질문을 준비하고 있습니다...`}
      </p>
      {/* 진행 바 */}
      <div className="mt-2 h-1 w-48 overflow-hidden rounded-full bg-white/10">
        <div className="h-full animate-progress-indeterminate rounded-full bg-blue-500" />
      </div>
    </div>
  );
}
