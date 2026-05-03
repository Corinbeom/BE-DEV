"use client";

import { useEffect, useRef, useState } from "react";
import type { SpeechInterviewQuestion } from "../api/types";
import type { SpeechSynthesisHook } from "../hooks/useSpeechSynthesis";

type Props = {
  question: SpeechInterviewQuestion;
  questionIndex: number;
  totalQuestions: number;
  tts: SpeechSynthesisHook;
  onDone: () => void;
};

const WAVEFORM_BARS = 28;

export function InterviewQuestion({ question, questionIndex, totalQuestions, tts, onDone }: Props) {
  const onDoneCalledRef = useRef(false);
  const [minDelayPassed, setMinDelayPassed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinDelayPassed(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  // TTS 로딩+재생 완료 후 버튼 활성화 (최소 1.5초 대기)
  // 안전 타임아웃: 20초 후 강제 활성화
  const [ttsTimedOut, setTtsTimedOut] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setTtsTimedOut(true), 20000);
    return () => clearTimeout(timer);
  }, []);

  const btnReady = (minDelayPassed && !tts.isSpeaking) || ttsTimedOut;

  // StrictMode 대응: speak + cleanup을 하나의 effect로 통합
  // StrictMode에서 첫 번째 speak는 cleanup의 stop()으로 중단되고,
  // 두 번째 실행에서 speak()가 다시 호출되어 정상 재생됨
  useEffect(() => {
    if (tts.isSupported && question.questionText) {
      tts.speak(question.questionText);
    }
    return () => { tts.stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDone = () => {
    if (onDoneCalledRef.current) return;
    onDoneCalledRef.current = true;
    tts.stop();
    onDone();
  };

  const words = question.questionText.split(" ");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-16">

      {/* 진행 상태 */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {Array.from({ length: totalQuestions }, (_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i < questionIndex
                  ? "h-1.5 w-5 bg-blue-400/50"
                  : i === questionIndex
                  ? "h-2 w-8 bg-blue-400"
                  : "h-1.5 w-3 bg-white/12"
              }`}
            />
          ))}
        </div>
        <span className="text-xs font-semibold tabular-nums text-white/35">
          {questionIndex + 1} / {totalQuestions}
        </span>
      </div>

      {/* TTS 파형 */}
      <div className="h-14 w-full max-w-xs flex items-end justify-center gap-[3px]">
        {Array.from({ length: WAVEFORM_BARS }, (_, i) => (
          <div
            key={i}
            className={`flex-1 max-w-[6px] rounded-full transition-colors duration-300 ${
              tts.isSupported && tts.isSpeaking
                ? "bg-blue-400 animate-sound-bar"
                : "bg-white/12"
            }`}
            style={
              tts.isSupported && tts.isSpeaking
                ? {
                    height: "100%",
                    animationDelay: `${(i % 7) * 0.09}s`,
                    animationDuration: `${0.55 + (i % 5) * 0.12}s`,
                  }
                : { height: "3px" }
            }
          />
        ))}
      </div>

      {/* 질문 카드 */}
      <div className="w-full max-w-2xl">
        <div className="mb-3 flex items-center gap-2">
          <span className="rounded-full bg-blue-500/12 px-3 py-1 text-xs font-semibold text-blue-300">
            {question.badge}
          </span>
          {tts.isSupported && tts.isSpeaking && (
            <span className="text-xs text-blue-400/60 animate-pulse">읽고 있습니다...</span>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl backdrop-blur-sm">
          <p className="text-xl font-semibold leading-relaxed text-white/90" aria-label={question.questionText}>
            {words.map((word, i) => (
              <span
                key={i}
                className="inline-block animate-word-reveal"
                style={{ animationDelay: `${i * 0.045}s` }}
              >
                {word}{i < words.length - 1 ? "\u00A0" : ""}
              </span>
            ))}
          </p>
        </div>
      </div>

      {/* 답변 시작 버튼 */}
      <button
        onClick={handleDone}
        disabled={!btnReady}
        className={`flex items-center gap-2 rounded-xl px-10 py-4 text-sm font-bold transition-all duration-300 ${
          btnReady
            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 scale-100"
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
