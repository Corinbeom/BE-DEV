"use client";

import { useEffect, useRef } from "react";
import type { SpeechSynthesisHook } from "../hooks/useSpeechSynthesis";

type Props = {
  tts: SpeechSynthesisHook;
  onDone: () => void;
};

const CLOSING_TEXT = "수고하셨습니다. AI가 답변을 분석하고 있습니다. 잠시 후 결과를 확인하실 수 있습니다.";
const TRANSITION_DELAY_MS = 3500;

export function InterviewClosing({ tts, onDone }: Props) {
  const doneRef = useRef(false);

  useEffect(() => {
    if (doneRef.current) return;
    doneRef.current = true;

    // TTS는 사이드 이펙트 — 전환에 영향 없음
    if (tts.isSupported) {
      tts.speak(CLOSING_TEXT);
    }

    // 전환은 항상 타이머로 보장
    const timer = setTimeout(onDone, TRANSITION_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => { tts.stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="text-center">
      <div className="flex size-16 mx-auto items-center justify-center rounded-full bg-green-500/15">
        <span className="material-symbols-outlined text-3xl text-green-400">check_circle</span>
      </div>
      <h2 className="mt-4 text-xl font-bold text-white">수고하셨습니다</h2>
      <p className="mt-2 text-sm text-white/45">분석을 시작했습니다. 잠시 후 확인하실 수 있습니다.</p>
      <div className="mt-4 h-1 w-32 mx-auto overflow-hidden rounded-full bg-white/10">
        <div className="h-full animate-progress-indeterminate rounded-full bg-green-500" />
      </div>
    </div>
  );
}
