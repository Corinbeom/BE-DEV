"use client";

import { useEffect, useRef, useState } from "react";
import type { ResumeQuestion } from "@/features/resume-analyzer/api/types";
import type { SpeechSynthesisHook } from "../hooks/useSpeechSynthesis";

type Props = {
  question: ResumeQuestion;
  questionIndex: number;
  totalQuestions: number;
  tts: SpeechSynthesisHook;
  onDone: () => void;
};

export function InterviewQuestion({ question, questionIndex, totalQuestions, tts, onDone }: Props) {
  const spokenRef = useRef(false);
  const onDoneCalledRef = useRef(false);

  // 버튼은 TTS와 독립적으로 1.5초 후 항상 활성화 (TTS 실패해도 진행 가능)
  const [btnReady, setBtnReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setBtnReady(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  // TTS 재생 (배경 오디오 — 완료 여부와 무관하게 버튼 동작)
  useEffect(() => {
    if (spokenRef.current) return;
    spokenRef.current = true;
    if (tts.isSupported && question.question) {
      tts.speak(`질문 ${questionIndex + 1}. ${question.question}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 언마운트 시 TTS 중단
  useEffect(() => {
    return () => { tts.stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDone = () => {
    if (onDoneCalledRef.current) return;
    onDoneCalledRef.current = true;
    tts.stop();
    onDone();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-16">
      {/* 진행 도트 */}
      <div className="flex items-center gap-1.5">
        {Array.from({ length: totalQuestions }, (_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-300 ${
              i < questionIndex
                ? "h-1.5 w-5 bg-blue-400/60"
                : i === questionIndex
                ? "h-2 w-8 bg-blue-400"
                : "h-1.5 w-3 bg-white/15"
            }`}
          />
        ))}
        <span className="ml-2 text-xs font-semibold text-white/40">
          {questionIndex + 1} / {totalQuestions}
        </span>
      </div>

      {/* 뱃지 */}
      <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-300">
        {question.badge}
      </span>

      {/* 질문 카드 */}
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl backdrop-blur-sm">
        {/* TTS 상태 */}
        <div className="mb-5 flex items-center gap-2">
          {tts.isSupported && tts.isSpeaking ? (
            <div className="flex items-center gap-2">
              <div className="flex items-end gap-0.5 h-4">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-0.5 rounded-full bg-blue-400 animate-sound-bar"
                    style={{ animationDelay: `${i * 0.12}s`, height: "100%" }}
                  />
                ))}
              </div>
              <span className="text-xs text-blue-400/80">읽고 있습니다...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-white/20">volume_up</span>
              <span className="text-xs text-white/20">질문을 확인하세요</span>
            </div>
          )}
        </div>

        <p className="text-lg font-semibold leading-relaxed text-white/90">
          {question.question}
        </p>

        {question.intention && (
          <div className="mt-5 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
            <p className="text-xs leading-relaxed text-white/30">
              <span className="text-white/20">출제 의도 </span>{question.intention}
            </p>
          </div>
        )}
      </div>

      {/* 답변 시작 버튼 — 1.5초 후 항상 활성화 */}
      <button
        onClick={handleDone}
        disabled={!btnReady}
        className={`flex items-center gap-2 rounded-xl px-10 py-4 text-sm font-bold transition-all duration-300 ${
          btnReady
            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 hover:shadow-blue-500/40 scale-100"
            : "cursor-not-allowed bg-white/5 text-white/20 scale-95"
        }`}
      >
        {btnReady ? (
          <>
            <span className="material-symbols-outlined text-sm">mic</span>
            답변 시작하기
          </>
        ) : (
          <>
            <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
            준비 중...
          </>
        )}
      </button>
    </div>
  );
}
