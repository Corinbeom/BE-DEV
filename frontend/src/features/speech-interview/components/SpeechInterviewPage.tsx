"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { apiBaseUrl } from "@/lib/api";
import { useSpeechInterviewMachine } from "../hooks/useSpeechInterviewMachine";
import { useTts } from "../hooks/useTts";
import { useGroqStt } from "../hooks/useGroqStt";
import { useBehavioralAnalysis } from "../hooks/useBehavioralAnalysis";
import { InterviewIntro } from "./InterviewIntro";
import { InterviewQuestion } from "./InterviewQuestion";
import { InterviewAnswering } from "./InterviewAnswering";
import { InterviewTransition } from "./InterviewTransition";
import { InterviewClosing } from "./InterviewClosing";
import { createSpeechInterview } from "../api/speechInterviewApi";
import type { ResumeSession } from "@/features/resume-analyzer/api/types";
import type { InterviewMode } from "../hooks/useSpeechInterviewMachine";

export function SpeechInterviewPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [state, actions] = useSpeechInterviewMachine();
  const tts = useTts();
  const stt = useGroqStt();
  const behavioral = useBehavioralAnalysis();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (state.useCamera && state.phase === "ANSWERING" && videoRef.current) {
      behavioral.start(videoRef.current);
    }
    if (state.phase !== "ANSWERING") {
      behavioral.stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.useCamera]);

  // CLOSING 진입 시 모든 답변 + 행동 지표를 새 엔드포인트로 전송 (fire-and-forget)
  useEffect(() => {
    if (state.phase !== "CLOSING" || !state.speechSession) return;
    const sessionId = state.speechSession.id;
    const metrics = behavioral.getMetrics();

    state.answers.forEach((answer) => {
      if (!answer.answerText || answer.answerText === "(답변 없음)") return;
      const body: Record<string, unknown> = {
        questionId: answer.questionId,
        answerText: answer.answerText,
      };
      if (metrics) {
        body.behavioralMetrics = {
          eyeContactRatio: metrics.eyeContactRatio,
          postureStability: metrics.postureStability,
          expressionVariety: metrics.expressionVariety,
          fidgetingScore: metrics.fidgetingScore,
        };
      }
      fetch(`${apiBaseUrl()}/api/speech-interviews/${sessionId}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      }).catch(() => {});
    });

    fetch(`${apiBaseUrl()}/api/speech-interviews/${sessionId}/complete`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {});

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  // REPORT 진입 시 결과 페이지로 이동
  useEffect(() => {
    if (state.phase === "REPORT" && state.speechSession) {
      router.push(`/speech-interview/result?sessionId=${state.speechSession.id}`);
    }
  }, [state.phase, state.speechSession, router]);

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

  async function handleSelectSession(session: ResumeSession, mode: InterviewMode, useCamera: boolean) {
    if (isCreatingSession) return;
    setIsCreatingSession(true);
    try {
      const speechSession = await createSpeechInterview(session.id, useCamera);
      actions.sessionCreated(speechSession, mode, useCamera);
      actions.startIntro();
    } catch (err) {
      console.error("스피치 면접 세션 생성 실패", err);
    } finally {
      setIsCreatingSession(false);
    }
  }

  function handleExit() {
    if (state.phase === "LOBBY") {
      router.push("/resume-analyzer");
      return;
    }
    if (state.phase === "CLOSING" || state.phase === "REPORT") {
      router.push("/speech-interview");
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

  return (
    <div className="relative min-h-screen bg-[#0a1628]">
      <div className="pointer-events-none fixed -right-32 -top-32 size-[500px] rounded-full bg-blue-600/5 blur-3xl" />
      <div className="pointer-events-none fixed -left-48 top-1/2 size-[440px] rounded-full bg-blue-600/8 blur-3xl" />

      <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#0a1628]/90 backdrop-blur-md">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-blue-400">record_voice_over</span>
            <span className="text-sm font-semibold text-white/80">스피치 면접</span>
          </div>

          <div className="flex items-center gap-3">
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

            <button
              onClick={handleExit}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/50 hover:bg-white/10 hover:text-white/80 transition-all"
            >
              {state.phase === "LOBBY" ? "← 돌아가기" : "나가기"}
            </button>
          </div>
        </div>
      </header>

      {state.useCamera && state.phase === "ANSWERING" && (
        <div className="fixed bottom-6 right-6 z-40 overflow-hidden rounded-2xl border border-white/15 shadow-2xl bg-black">
          <video ref={videoRef} autoPlay muted playsInline className="h-28 w-44 object-cover" />
          <div className="absolute bottom-1.5 left-2 flex items-center gap-1">
            <span className="size-1.5 animate-pulse rounded-full bg-red-400" />
            <span className="text-[9px] text-white/60 font-medium">LIVE</span>
          </div>
        </div>
      )}

      <main className="pt-14">
        {state.phase === "LOBBY" && (
          <InterviewIntro onStart={handleSelectSession} isCreatingSession={isCreatingSession} />
        )}

        {state.phase === "INTRO" && (
          <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-6">
            <div className="flex size-20 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10">
              <span className="material-symbols-outlined text-4xl text-blue-400">record_voice_over</span>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">스피치 면접을 시작합니다</h2>
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
              {state.speechSession && (
                <p className="text-xs text-white/30">
                  {state.speechSession.title} · {state.questions.length}개 질문
                </p>
              )}
            </div>
          </div>
        )}

        {state.phase === "QUESTION_READ" && currentQuestion && (
          <InterviewQuestion
            question={currentQuestion}
            questionIndex={state.currentIndex}
            totalQuestions={state.questions.length}
            tts={tts}
            onDone={actions.onQuestionDone}
          />
        )}

        {state.phase === "ANSWERING" && currentQuestion && (
          <InterviewAnswering
            question={currentQuestion}
            questionIndex={state.currentIndex}
            totalQuestions={state.questions.length}
            stt={stt}
            useCamera={state.useCamera}
            getMetrics={behavioral.getMetrics}
            onSubmit={actions.submitAnswer}
          />
        )}

        {state.phase === "TRANSITION" && (
          <InterviewTransition
            currentIndex={state.currentIndex}
            totalQuestions={state.questions.length}
            onDone={actions.onTransitionDone}
          />
        )}

        {state.phase === "CLOSING" && (
          <div className="flex min-h-screen flex-col items-center justify-center gap-6">
            <InterviewClosing tts={tts} onDone={actions.onClosingDone} />
            <button
              onClick={() => router.push("/speech-interview")}
              className="mt-2 rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-white/40 hover:bg-white/10 hover:text-white/70 transition-all"
            >
              결과 확인 없이 홈으로
            </button>
          </div>
        )}

        {state.phase === "REPORT" && (
          <div className="flex min-h-screen flex-col items-center justify-center">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined animate-spin text-blue-400">progress_activity</span>
              <span className="text-sm text-white/50">결과 페이지로 이동 중...</span>
            </div>
          </div>
        )}
      </main>

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
