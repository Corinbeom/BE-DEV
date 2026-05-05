"use client";

import { useState } from "react";
import { useResumeSessions } from "@/features/resume-analyzer/hooks/useResumeSessions";
import type { ResumeSession } from "@/features/resume-analyzer/api/types";
import { cn } from "@/lib/utils";

type Props = {
  onStart: (session: ResumeSession) => void;
};

export function InterviewIntro({ onStart }: Props) {
  const { data: sessions = [], isLoading } = useResumeSessions();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const readySessions = sessions.filter(
    (s) => s.status === "QUESTIONS_READY" || s.status === "COMPLETED"
  );
  const selected = readySessions.find((s) => s.id === selectedId) ?? null;

  function handleStart() {
    if (!selected) return;
    onStart(selected);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-12">
      {/* 헤더 */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-blue-500/15">
          <span className="material-symbols-outlined text-3xl text-blue-400">record_voice_over</span>
        </div>
        <h1 className="text-2xl font-bold text-white">AI 모의 면접</h1>
        <p className="mt-2 text-sm text-white/45">
          실전처럼 말하며 면접을 연습하세요. TTS로 질문을 읽어드립니다.
        </p>
      </div>

      {/* 세션 선택 */}
      <div className="w-full max-w-md">
        <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/40">
          <span className="flex size-4 items-center justify-center rounded-full bg-blue-500/30 text-[10px] font-bold text-blue-400">1</span>
          면접 세션 선택
        </p>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        ) : readySessions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 p-6 text-center">
            <p className="text-sm text-white/40">면접 연습 가능한 세션이 없습니다.</p>
            <p className="mt-1 text-xs text-white/25">이력서 분석에서 먼저 질문을 생성해 주세요.</p>
          </div>
        ) : (
          <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
            {readySessions.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={cn(
                  "w-full rounded-xl border px-4 py-3 text-left transition-all",
                  selectedId === s.id
                    ? "border-blue-500/50 bg-blue-500/10 ring-1 ring-blue-500/30"
                    : "border-white/8 bg-white/[0.03] hover:bg-white/[0.06]"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white/90">{s.title}</p>
                    <p className="mt-0.5 text-xs text-white/40">
                      {s.positionType ?? "포지션 미지정"} · {s.questions.filter((q) => q.question).length}개 질문
                    </p>
                  </div>
                  {selectedId === s.id && (
                    <span className="material-symbols-outlined shrink-0 text-sm text-blue-400">check_circle</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 시작 버튼 */}
      <button
        disabled={!selected}
        onClick={handleStart}
        className={cn(
          "w-full max-w-md rounded-xl py-4 text-sm font-bold transition-all duration-200",
          selected
            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 hover:shadow-blue-500/40"
            : "cursor-not-allowed bg-white/5 text-white/20"
        )}
      >
        {selected ? "면접 시작하기" : "세션을 선택해 주세요"}
      </button>
    </div>
  );
}
