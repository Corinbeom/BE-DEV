"use client";

import { useState } from "react";
import { useResumeSessions } from "@/features/resume-analyzer/hooks/useResumeSessions";
import type { ResumeSession } from "@/features/resume-analyzer/api/types";
import type { InterviewMode } from "../hooks/useMockInterview";
import { cn } from "@/lib/utils";

type MediaMode = "camera" | "voice";

type Props = {
  onStart: (session: ResumeSession, mode: InterviewMode, useCamera: boolean) => void;
};

export function InterviewIntro({ onStart }: Props) {
  const { data: sessions = [], isLoading } = useResumeSessions();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mediaMode, setMediaMode] = useState<MediaMode | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const [isRequestingCamera, setIsRequestingCamera] = useState(false);

  const readySessions = sessions.filter(
    (s) => s.status === "QUESTIONS_READY" || s.status === "COMPLETED"
  );
  const selected = readySessions.find((s) => s.id === selectedId) ?? null;

  async function selectCamera() {
    if (isRequestingCamera) return;
    setCameraError(false);
    setIsRequestingCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // 즉시 트랙 해제 (면접 시작 시 다시 요청함)
      stream.getTracks().forEach((t) => t.stop());
      setMediaMode("camera");
    } catch {
      setCameraError(true);
      setMediaMode("voice"); // 실패 시 자동으로 음성 모드 전환
    } finally {
      setIsRequestingCamera(false);
    }
  }

  function selectVoice() {
    setCameraError(false);
    setMediaMode("voice");
  }

  function handleStart() {
    if (!selected || !mediaMode) return;
    onStart(selected, "voice", mediaMode === "camera");
  }

  const canStart = selected !== null && mediaMode !== null;

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

      {/* ── STEP 1: 세션 선택 ── */}
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
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
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
                    <p className="text-sm font-semibold text-white/90 truncate">{s.title}</p>
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

      {/* ── STEP 2: 분석 모드 선택 (세션 선택 후 노출) ── */}
      {selected && (
        <div className="w-full max-w-md">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/40">
            <span className="flex size-4 items-center justify-center rounded-full bg-blue-500/30 text-[10px] font-bold text-blue-400">2</span>
            분석 모드 선택
          </p>

          <div className="grid grid-cols-2 gap-3">
            {/* 카메라 카드 */}
            <button
              onClick={selectCamera}
              disabled={isRequestingCamera}
              className={cn(
                "relative flex flex-col items-center gap-3 rounded-2xl border p-5 text-center transition-all duration-200",
                mediaMode === "camera"
                  ? "border-blue-500/50 bg-blue-500/10 ring-1 ring-blue-500/25"
                  : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]",
                isRequestingCamera && "cursor-wait"
              )}
            >
              {mediaMode === "camera" && (
                <span className="absolute right-2 top-2 material-symbols-outlined text-sm text-blue-400">check_circle</span>
              )}
              <div className={cn(
                "flex size-10 items-center justify-center rounded-xl",
                mediaMode === "camera" ? "bg-blue-500/20" : "bg-white/5"
              )}>
                {isRequestingCamera ? (
                  <span className="material-symbols-outlined animate-spin text-xl text-white/50">progress_activity</span>
                ) : (
                  <span className={cn(
                    "material-symbols-outlined text-xl",
                    mediaMode === "camera" ? "text-blue-400" : "text-white/50"
                  )}>videocam</span>
                )}
              </div>
              <div>
                <p className={cn(
                  "text-sm font-semibold",
                  mediaMode === "camera" ? "text-blue-200" : "text-white/70"
                )}>
                  카메라 사용
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-white/35">
                  시선·자세·표정<br />행동 분석 포함
                </p>
              </div>
            </button>

            {/* 음성 카드 */}
            <button
              onClick={selectVoice}
              className={cn(
                "relative flex flex-col items-center gap-3 rounded-2xl border p-5 text-center transition-all duration-200",
                mediaMode === "voice"
                  ? "border-white/25 bg-white/[0.07] ring-1 ring-white/15"
                  : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
              )}
            >
              {mediaMode === "voice" && (
                <span className="absolute right-2 top-2 material-symbols-outlined text-sm text-white/60">check_circle</span>
              )}
              <div className={cn(
                "flex size-10 items-center justify-center rounded-xl",
                mediaMode === "voice" ? "bg-white/10" : "bg-white/5"
              )}>
                <span className={cn(
                  "material-symbols-outlined text-xl",
                  mediaMode === "voice" ? "text-white/80" : "text-white/40"
                )}>mic</span>
              </div>
              <div>
                <p className={cn(
                  "text-sm font-semibold",
                  mediaMode === "voice" ? "text-white/90" : "text-white/60"
                )}>
                  음성만 사용
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-white/35">
                  음성 답변만<br />행동 분석 없음
                </p>
              </div>
            </button>
          </div>

          {/* 카메라 오류 메시지 */}
          {cameraError && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-400/80">
              <span className="material-symbols-outlined text-sm">warning</span>
              카메라 접근이 거부되어 음성 모드로 전환됐습니다. 다시 시도하려면 카메라 카드를 클릭하세요.
            </p>
          )}

          {/* 안내 문구 */}
          {mediaMode === "camera" && (
            <p className="mt-2 text-[11px] text-white/25 text-center">
              영상은 브라우저 내에서만 처리됩니다. 서버에 전송되지 않습니다.
            </p>
          )}
        </div>
      )}

      {/* ── 시작 버튼 ── */}
      <button
        disabled={!canStart}
        onClick={handleStart}
        className={cn(
          "w-full max-w-md rounded-xl py-4 text-sm font-bold transition-all duration-200",
          canStart
            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 hover:shadow-blue-500/40"
            : "cursor-not-allowed bg-white/5 text-white/20"
        )}
      >
        {!selected
          ? "세션을 선택해 주세요"
          : !mediaMode
          ? "분석 모드를 선택해 주세요"
          : "면접 시작하기"}
      </button>
    </div>
  );
}
