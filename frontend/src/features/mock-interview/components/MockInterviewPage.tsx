"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { apiBaseUrl } from "@/lib/api";
import { useMockInterview } from "../hooks/useMockInterview";
import { useSpeechSynthesis } from "../hooks/useSpeechSynthesis";
import { useGroqStt } from "../hooks/useGroqStt";
import { useBehavioralAnalysis } from "../hooks/useBehavioralAnalysis";
import { InterviewIntro } from "./InterviewIntro";
import { InterviewerAvatar } from "./InterviewerAvatar";
import type { AvatarState } from "./InterviewerAvatar";
import { InterviewQuestion } from "./InterviewQuestion";
import { InterviewAnswering } from "./InterviewAnswering";
import { InterviewTransition } from "./InterviewTransition";
import { InterviewClosing } from "./InterviewClosing";
import { MockInterviewReport } from "./MockInterviewReport";
import type { ResumeSession } from "@/features/resume-analyzer/api/types";
import type { InterviewMode } from "../hooks/useMockInterview";

export function MockInterviewPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [state, actions] = useMockInterview();
  const tts = useSpeechSynthesis();
  const stt = useGroqStt();
  const behavioral = useBehavioralAnalysis();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // 인증 가드
  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [user, isLoading, router]);

  // 카메라 스트림 연결 (ANSWERING 상태에서만 활성)
  useEffect(() => {
    if (state.useCamera && state.phase === "ANSWERING" && videoRef.current) {
      behavioral.start(videoRef.current);
    }
    if (state.phase !== "ANSWERING") {
      behavioral.stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.useCamera]);

  // CLOSING 진입 시 모든 답변 + 행동지표를 백그라운드에서 제출 (fire-and-forget)
  // apiFetch 대신 raw fetch 사용 — 429 재시도 지연 없이 즉시 전송
  useEffect(() => {
    if (state.phase !== "CLOSING") return;
    const metrics = behavioral.getMetrics();

    state.answers.forEach((answer) => {
      if (!answer.answerText || answer.answerText === "(답변 없음)") return;
      const body: Record<string, unknown> = { answerText: answer.answerText };
      if (metrics) {
        body.behavioralMetrics = {
          eyeContactRatio: metrics.eyeContactRatio,
          postureStability: metrics.postureStability,
          expressionVariety: metrics.expressionVariety,
          fidgetingScore: metrics.fidgetingScore,
        };
      }
      fetch(`${apiBaseUrl()}/api/resume-questions/${answer.questionId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      }).catch(() => {}); // 에러 묵음 — 백그라운드 처리이므로 UI에 영향 없음
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  // 탭 닫기/새로고침 방어 (세션 진행 중)
  useEffect(() => {
    if (state.phase === "LOBBY" || state.phase === "REPORT") return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [state.phase]);

  if (isLoading || !user) return null;

  function handleSelectSession(session: ResumeSession, mode: InterviewMode, useCamera: boolean) {
    actions.selectSession(session, mode, useCamera);
    actions.startIntro();
  }

  // 나가기 버튼 동작
  function handleExit() {
    if (state.phase === "LOBBY") {
      router.push("/resume-analyzer");
      return;
    }
    setShowExitConfirm(true);
  }

  function confirmExit() {
    tts.stop();
    stt.stop();
    behavioral.stop();
    actions.reset();
    setShowExitConfirm(false);
  }

  const currentQuestion = state.questions[state.currentIndex];

  // 면접관 아바타 상태 결정
  const avatarState: AvatarState =
    state.phase === "QUESTION_READ" || state.phase === "INTRO" || state.phase === "CLOSING"
      ? "speaking"
      : state.phase === "ANSWERING"
      ? "listening"
      : "idle";

  const showAvatar =
    state.phase === "INTRO" ||
    state.phase === "QUESTION_READ" ||
    state.phase === "ANSWERING" ||
    state.phase === "CLOSING";

  return (
    <div className="relative min-h-screen bg-[#0a1628]">
      {/* 배경 블롭 */}
      <div className="pointer-events-none fixed -right-32 -top-32 size-[500px] rounded-full bg-blue-600/5 blur-3xl" />
      <div className="pointer-events-none fixed -left-48 top-1/2 size-[440px] rounded-full bg-blue-600/8 blur-3xl" />

      {/* ── 상단 네비 바 ── */}
      <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#0a1628]/90 backdrop-blur-md">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-blue-400">record_voice_over</span>
            <span className="text-sm font-semibold text-white/80">AI 모의 면접</span>
          </div>

          <div className="flex items-center gap-3">
            {/* 질문 진행 도트 (진행 중일 때) */}
            {state.phase !== "LOBBY" && state.phase !== "REPORT" && state.questions.length > 0 && (
              <div className="hidden sm:flex items-center gap-1">
                {state.questions.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i < state.answers.length
                        ? "w-5 bg-blue-400/70"
                        : i === state.currentIndex
                        ? "w-5 bg-blue-500 animate-pulse"
                        : "w-2.5 bg-white/10"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* 나가기 버튼 */}
            <button
              onClick={handleExit}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/50 hover:bg-white/10 hover:text-white/80 transition-all"
            >
              {state.phase === "LOBBY" ? "← 돌아가기" : "나가기"}
            </button>
          </div>
        </div>
      </header>

      {/* 카메라 프리뷰 (ANSWERING, 카메라 사용 시) */}
      {state.useCamera && state.phase === "ANSWERING" && (
        <div className="fixed bottom-6 right-6 z-40 overflow-hidden rounded-2xl border border-white/15 shadow-2xl bg-black">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="h-28 w-44 object-cover"
          />
          <div className="absolute bottom-1.5 left-2 flex items-center gap-1">
            <span className="size-1.5 animate-pulse rounded-full bg-red-400" />
            <span className="text-[9px] text-white/60 font-medium">LIVE</span>
          </div>
        </div>
      )}

      {/* ── 메인 컨텐츠 ── */}
      <main className="pt-14">
        {/* LOBBY */}
        {state.phase === "LOBBY" && (
          <InterviewIntro onStart={handleSelectSession} />
        )}

        {/* INTRO — 면접 시작 */}
        {state.phase === "INTRO" && (
          <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-6">
            <InterviewerAvatar state="speaking" />
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">면접을 시작합니다</h2>
              <p className="mt-2 text-sm text-white/45 max-w-sm">
                각 질문을 읽은 후 <strong className="text-white/70">답변 시작하기</strong> 버튼을 누르고<br />
                자연스럽게 말씀해 주세요.
              </p>
            </div>
            <div className="flex flex-col items-center gap-3 w-full max-w-sm">
              <button
                onClick={actions.onIntroDone}
                className="w-full rounded-xl bg-blue-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all"
              >
                <span className="material-symbols-outlined mr-2 text-sm align-middle">play_arrow</span>
                시작
              </button>
              {state.session && (
                <p className="text-xs text-white/30">
                  {state.session.title} · {state.questions.length}개 질문
                </p>
              )}
            </div>
          </div>
        )}

        {/* QUESTION_READ */}
        {state.phase === "QUESTION_READ" && currentQuestion && (
          <div className="flex min-h-screen flex-col">
            {/* 아바타 영역 */}
            <div className="flex justify-center pt-16 pb-2">
              <InterviewerAvatar state={avatarState} className="scale-90" />
            </div>
            <InterviewQuestion
              question={currentQuestion}
              questionIndex={state.currentIndex}
              totalQuestions={state.questions.length}
              tts={tts}
              onDone={actions.onQuestionDone}
            />
          </div>
        )}

        {/* ANSWERING */}
        {state.phase === "ANSWERING" && currentQuestion && (
          <div className="flex min-h-screen flex-col">
            {/* 소형 아바타 (좌상단) */}
            <div className="flex justify-center pt-14 pb-0">
              <InterviewerAvatar state="listening" className="scale-75 opacity-70" />
            </div>
            <InterviewAnswering
              question={currentQuestion}
              questionIndex={state.currentIndex}
              totalQuestions={state.questions.length}
              stt={stt}
              useCamera={state.useCamera}
              getMetrics={behavioral.getMetrics}
              onSubmit={actions.submitAnswer}
            />
          </div>
        )}

        {/* TRANSITION */}
        {state.phase === "TRANSITION" && (
          <InterviewTransition
            currentIndex={state.currentIndex}
            totalQuestions={state.questions.length}
            onDone={actions.onTransitionDone}
          />
        )}

        {/* CLOSING */}
        {state.phase === "CLOSING" && (
          <div className="flex min-h-screen flex-col items-center justify-center gap-6">
            <InterviewerAvatar state="speaking" />
            <InterviewClosing tts={tts} onDone={actions.onClosingDone} />
          </div>
        )}

        {/* REPORT */}
        {state.phase === "REPORT" && state.session && (
          <MockInterviewReport
            answers={state.answers}
            sessionId={state.session.id}
            sessionTitle={state.session.title}
            behavioralMetrics={behavioral.getMetrics()}
            onRestart={actions.reset}
          />
        )}
      </main>

      {/* ── 나가기 확인 모달 ── */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-6">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0f1e35] p-6 shadow-2xl">
            <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-red-500/10">
              <span className="material-symbols-outlined text-xl text-red-400">warning</span>
            </div>
            <h3 className="text-base font-bold text-white">면접을 종료하시겠습니까?</h3>
            <p className="mt-2 text-sm text-white/50">
              현재 세션의 진행 상황은 저장되지 않습니다.
              {state.answers.length > 0 && ` (${state.answers.length}개 답변 기록됨)`}
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white/70 hover:bg-white/10 transition-all"
              >
                계속하기
              </button>
              <button
                onClick={confirmExit}
                className="flex-1 rounded-xl bg-red-500/20 border border-red-500/30 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/30 transition-all"
              >
                종료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
