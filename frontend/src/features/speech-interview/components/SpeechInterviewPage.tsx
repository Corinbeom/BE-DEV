"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useSpeechInterviewMachine } from "../hooks/useSpeechInterviewMachine";
import { useSpeechSynthesis } from "../hooks/useSpeechSynthesis";
import { useGroqStt } from "../hooks/useGroqStt";
import { InterviewIntro } from "./InterviewIntro";
import { InterviewClosing } from "./InterviewClosing";
import { ConversationView } from "./ConversationView";
import { createSpeechInterview, chatWithInterviewer } from "../api/speechInterviewApi";
import type { ResumeSession } from "@/features/resume-analyzer/api/types";
import type { InterviewMode } from "../hooks/useSpeechInterviewMachine";

const MAX_TURNS = 8;

export function SpeechInterviewPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [state, actions] = useSpeechInterviewMachine();
  const tts = useSpeechSynthesis();
  const stt = useGroqStt();
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const chatInFlightRef = useRef(false);

  // 인증 가드
  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [user, isLoading, router]);

  // AI_THINKING 감지 → chatWithInterviewer 호출
  const handleAiThinking = useCallback(async () => {
    if (!state.speechSession || chatInFlightRef.current) return;
    chatInFlightRef.current = true;
    try {
      const lastLog = state.conversationLog;
      const lastUserEntry = lastLog.filter((e) => e.role === "user").pop();
      const userMessage = lastUserEntry?.text ?? "";

      const response = await chatWithInterviewer(state.speechSession.id, { userMessage });

      setChatError(null);
      actions.aiResponse(response.aiMessage, response.turnIndex, response.isComplete, response.questionId, response.badge);
    } catch (err) {
      console.error("chat 호출 실패:", err);
      const msg = err instanceof Error ? err.message : "알 수 없는 오류";
      setChatError(`AI 면접관 연결 실패: ${msg}. 잠시 후 다시 시도해 주세요.`);
    } finally {
      chatInFlightRef.current = false;
    }
  }, [state.speechSession, state.conversationLog, actions]);

  useEffect(() => {
    if (state.phase === "CONVERSING" && state.subPhase === "AI_THINKING") {
      handleAiThinking();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.subPhase]);

  // REPORT 진입 시 결과 페이지로 이동
  useEffect(() => {
    if (state.phase === "REPORT" && state.speechSession) {
      router.push(`/speech-interview/result?sessionId=${state.speechSession.id}`);
    }
  }, [state.phase, state.speechSession, router]);

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

  async function handleSelectSession(session: ResumeSession, mode: InterviewMode) {
    if (isCreatingSession) return;
    setIsCreatingSession(true);
    try {
      const speechSession = await createSpeechInterview(session.id);
      actions.sessionCreated(speechSession, mode);
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
      tts.stop();
      stt.stop();
      actions.reset();
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

  return (
    <div className="relative min-h-screen bg-[var(--speech-bg)]">
      {/* 헤더 */}
      <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-[var(--speech-bg)]/95 backdrop-blur-md">
        <div className="flex h-14 items-center px-6">
          {/* 왼쪽: 로고 레이블 */}
          <div className="flex shrink-0 items-center gap-2">
            <div className="size-1.5 rounded-full bg-blue-500" />
            <span className="text-sm font-semibold text-white/80">스피치 면접</span>
          </div>

          {/* 가운데: 턴 진행 표시 */}
          {state.phase === "CONVERSING" && (
            <div className="flex flex-1 items-center justify-center gap-2">
              {Array.from({ length: MAX_TURNS }, (_, i) => {
                const n = i + 1;
                const done = n < state.turnIndex;
                const active = n === state.turnIndex;
                return (
                  <div
                    key={i}
                    style={{
                      width: active ? 28 : 8,
                      height: 8,
                      borderRadius: 4,
                      background: done ? "var(--speech-accent)" : active ? "var(--speech-accent)" : "rgb(var(--speech-text-rgb) / 0.12)",
                      transition: "all 0.3s ease",
                      boxShadow: active ? "0 0 8px rgb(var(--speech-accent-rgb) / 0.6)" : "none",
                    }}
                  />
                );
              })}
              <span className="ml-2 font-mono text-[11px] text-white/35">
                {state.turnIndex}/{MAX_TURNS}
              </span>
            </div>
          )}
          {state.phase !== "CONVERSING" && <div className="flex-1" />}

          {/* 오른쪽: 나가기 버튼 */}
          <div className="ml-auto flex shrink-0 justify-end">
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
          <InterviewIntro onStart={handleSelectSession} isCreatingSession={isCreatingSession} />
        )}

        {/* INTRO */}
        {state.phase === "INTRO" && (
          <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-6">
            <div className="flex size-20 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10">
              <span className="material-symbols-outlined text-4xl text-blue-400">smart_toy</span>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">AI 면접을 시작합니다</h2>
              <p className="mt-2 max-w-sm text-sm text-white/45">
                AI 면접관이 이력서를 기반으로 질문합니다.<br />
                답변 후 <strong className="text-white/70">답변 완료</strong> 버튼을 누르세요.
              </p>
            </div>
            <div className="flex w-full max-w-sm flex-col items-center gap-3">
              <button
                onClick={actions.onIntroDone}
                className="w-full rounded-xl bg-blue-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-500"
              >
                <span className="material-symbols-outlined mr-2 align-middle text-sm">play_arrow</span>
                면접 시작
              </button>
              {state.speechSession && (
                <p className="text-xs text-white/30">
                  {state.speechSession.title} · 최대 {MAX_TURNS}턴
                </p>
              )}
            </div>
          </div>
        )}

        {/* CONVERSING — 에러 배너 */}
        {state.phase === "CONVERSING" && chatError && (
          <div className="fixed top-16 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 px-4">
            <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 shadow-lg">
              <span className="material-symbols-outlined text-sm text-red-400">error</span>
              <p className="flex-1 text-xs text-red-300">{chatError}</p>
              <button
                onClick={() => { setChatError(null); chatInFlightRef.current = false; handleAiThinking(); }}
                className="shrink-0 rounded-lg bg-red-500/20 px-2.5 py-1 text-[10px] font-semibold text-red-300 transition-all hover:bg-red-500/30"
              >
                재시도
              </button>
            </div>
          </div>
        )}

        {/* CONVERSING */}
        {state.phase === "CONVERSING" && (
          <ConversationView
            subPhase={state.subPhase}
            currentAiMessage={state.currentAiMessage}
            currentBadge={state.currentBadge}
            turnIndex={state.turnIndex}
            maxTurns={MAX_TURNS}
            conversationLog={state.conversationLog}
            tts={tts}
            stt={stt}
            onAiSpeakDone={actions.aiSpeakDone}
            onUserSubmit={actions.userSubmit}
          />
        )}

        {/* CLOSING */}
        {state.phase === "CLOSING" && (
          <div className="flex min-h-screen flex-col items-center justify-center gap-6">
            <InterviewClosing tts={tts} onDone={actions.onClosingDone} />
            <button
              onClick={() => { tts.stop(); actions.reset(); }}
              className="mt-2 rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-white/40 transition-all hover:bg-white/10 hover:text-white/70"
            >
              결과 확인 없이 홈으로
            </button>
          </div>
        )}

        {/* REPORT */}
        {state.phase === "REPORT" && (
          <div className="flex min-h-screen flex-col items-center justify-center">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined animate-spin text-blue-400">progress_activity</span>
              <span className="text-sm text-white/50">결과 페이지로 이동 중...</span>
            </div>
          </div>
        )}
      </main>

      {/* 종료 확인 모달 */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[var(--speech-panel)] p-6 shadow-2xl">
            <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-red-500/10">
              <span className="material-symbols-outlined text-xl text-red-400">warning</span>
            </div>
            <h3 className="text-base font-bold text-white">면접을 종료하시겠습니까?</h3>
            <p className="mt-2 text-sm text-white/50">
              현재 진행 중인 면접이 중단됩니다. 지금까지의 대화는 결과 페이지에서 확인할 수 있습니다.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white/70 transition-all hover:bg-white/10"
              >
                계속하기
              </button>
              <button
                onClick={confirmExit}
                className="flex-1 rounded-xl border border-red-500/30 bg-red-500/20 py-3 text-sm font-semibold text-red-400 transition-all hover:bg-red-500/30"
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
