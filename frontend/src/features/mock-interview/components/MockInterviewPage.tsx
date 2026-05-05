"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { apiBaseUrl } from "@/lib/api";
import { useMockInterview } from "../hooks/useMockInterview";
import { useSpeechSynthesis } from "../hooks/useSpeechSynthesis";
import { useGroqStt } from "../hooks/useGroqStt";
import { InterviewIntro } from "./InterviewIntro";
import { InterviewerAvatar } from "./InterviewerAvatar";
import type { AvatarState } from "./InterviewerAvatar";
import { InterviewQuestion } from "./InterviewQuestion";
import { InterviewAnswering } from "./InterviewAnswering";
import { InterviewTransition } from "./InterviewTransition";
import { InterviewClosing } from "./InterviewClosing";
import { MockInterviewReport } from "./MockInterviewReport";
import type { ResumeSession } from "@/features/resume-analyzer/api/types";

export function MockInterviewPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [state, actions] = useMockInterview();
  const tts = useSpeechSynthesis();
  const stt = useGroqStt();
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // 인증 가드
  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [user, isLoading, router]);

  // CLOSING 진입 시 답변 백그라운드 제출 (fire-and-forget)
  useEffect(() => {
    if (state.phase !== "CLOSING") return;
    state.answers.forEach((answer) => {
      if (!answer.answerText || answer.answerText === "(답변 없음)") return;
      fetch(`${apiBaseUrl()}/api/resume-questions/${answer.questionId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ answerText: answer.answerText }),
      }).catch(() => {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  // 새로고침 방지
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

  function handleSelectSession(session: ResumeSession) {
    actions.selectSession(session);
    actions.startIntro();
  }

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
    actions.reset();
    setShowExitConfirm(false);
  }

  const currentQuestion = state.questions[state.currentIndex];

  const avatarState: AvatarState =
    state.phase === "QUESTION_READ" || state.phase === "INTRO" || state.phase === "CLOSING"
      ? "speaking"
      : state.phase === "ANSWERING"
      ? "listening"
      : "idle";

  return (
    <div className="relative min-h-screen bg-[#090f1c]">
      {/* 배경 블롭 */}
      <div className="pointer-events-none fixed -right-32 -top-32 size-[500px] rounded-full bg-blue-600/5 blur-3xl" />
      <div className="pointer-events-none fixed -left-48 top-1/2 size-[440px] rounded-full bg-blue-600/8 blur-3xl" />

      {/* 헤더 */}
      <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#090f1c]/95 backdrop-blur-md">
        <div className="flex h-14 items-center px-6">
          <div className="flex min-w-[160px] items-center gap-2 shrink-0">
            <div className="size-1.5 rounded-full bg-blue-500" />
            <span className="text-sm font-semibold text-white/80">AI 모의 면접</span>
          </div>

          {/* 진행 표시 */}
          {state.phase !== "LOBBY" && state.phase !== "REPORT" && state.questions.length > 0 && (
            <div className="flex flex-1 items-center justify-center gap-2">
              {state.questions.map((_, i) => {
                const done = i < state.answers.length;
                const active = i === state.currentIndex && state.phase !== "CLOSING";
                return (
                  <div
                    key={i}
                    style={{
                      width: active ? 28 : 8,
                      height: 8,
                      borderRadius: 4,
                      background: done ? "#3B82F6" : active ? "#3B82F6" : "rgba(255,255,255,0.12)",
                      transition: "all 0.3s ease",
                      boxShadow: active ? "0 0 8px rgba(59,130,246,0.6)" : "none",
                    }}
                  />
                );
              })}
              <span className="ml-2 font-mono text-[11px] text-white/35">
                {state.answers.length}/{state.questions.length}
              </span>
            </div>
          )}
          {(state.phase === "LOBBY" || state.phase === "REPORT") && <div className="flex-1" />}

          <div className="flex min-w-[160px] justify-end">
            <button
              onClick={handleExit}
              className="rounded-md border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-white/50 transition-all hover:bg-white/[0.08] hover:text-white/80"
            >
              {state.phase === "LOBBY" ? "← 돌아가기" : "나가기"}
            </button>
          </div>
        </div>
      </header>

      <main className="pt-14">
        {/* LOBBY */}
        {state.phase === "LOBBY" && (
          <InterviewIntro onStart={handleSelectSession} />
        )}

        {/* INTRO */}
        {state.phase === "INTRO" && (
          <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-6">
            <InterviewerAvatar state="speaking" />
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">면접을 시작합니다</h2>
              <p className="mt-2 max-w-sm text-sm text-white/45">
                각 질문을 읽은 후 <strong className="text-white/70">답변 시작하기</strong> 버튼을 누르고<br />
                자연스럽게 말씀해 주세요.
              </p>
            </div>
            <div className="flex w-full max-w-sm flex-col items-center gap-3">
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
            <div className="flex justify-center pt-16 pb-2">
              <InterviewerAvatar state={avatarState} />
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
            <div className="flex justify-center pt-14 pb-0">
              <InterviewerAvatar state="listening" />
            </div>
            <InterviewAnswering
              question={currentQuestion}
              questionIndex={state.currentIndex}
              totalQuestions={state.questions.length}
              stt={stt}
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
            onRestart={actions.reset}
          />
        )}
      </main>

      {/* 나가기 확인 모달 */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm">
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
                className="flex-1 rounded-xl border border-red-500/30 bg-red-500/20 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/30 transition-all"
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
