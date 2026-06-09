"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SpeechSynthesisHook = {
  speak: (text: string, onEnd?: () => void) => void;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
  isError?: boolean;
};

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) { resolve(voices); return; }
    const handler = () => {
      resolve(window.speechSynthesis.getVoices());
      window.speechSynthesis.onvoiceschanged = null;
    };
    window.speechSynthesis.onvoiceschanged = handler;
    setTimeout(() => {
      window.speechSynthesis.onvoiceschanged = null;
      resolve(window.speechSynthesis.getVoices());
    }, 2000);
  });
}

export function useSpeechSynthesis(): SpeechSynthesisHook {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported] = useState(() => typeof window !== "undefined" && "speechSynthesis" in window);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const onEndRef = useRef<(() => void) | undefined>(undefined);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Chrome TTS 15초 컷오프 방지용 keep-alive 인터벌
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = () => {
    if (safetyTimerRef.current) { clearTimeout(safetyTimerRef.current); safetyTimerRef.current = null; }
    if (keepAliveRef.current) { clearInterval(keepAliveRef.current); keepAliveRef.current = null; }
  };

  useEffect(() => {
    if (isSupported) window.speechSynthesis.getVoices(); // 미리 캐싱 트리거
    return () => {
      if (isSupported) window.speechSynthesis.cancel();
      clearTimers();
    };
  }, [isSupported]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isSupported) {
        window.speechSynthesis.cancel();
        clearTimers();
        setIsSpeaking(false);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isSupported]);

  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!isSupported) { onEnd?.(); return; }

      window.speechSynthesis.cancel();
      clearTimers();
      setIsSpeaking(false);
      onEndRef.current = onEnd;

      const fireEnd = () => {
        clearTimers();
        setIsSpeaking(false);
        const cb = onEndRef.current;
        onEndRef.current = undefined;
        cb?.();
      };

      loadVoices().then((voices) => {
        if (onEndRef.current !== onEnd) return; // 다른 speak()로 교체됨

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "ko-KR";
        utterance.rate = 0.92;
        utterance.pitch = 1.0;

        const koVoice =
          voices.find((v) => v.lang === "ko-KR" && v.name.toLowerCase().includes("google")) ??
          voices.find((v) => v.lang.startsWith("ko")) ??
          null;
        if (koVoice) utterance.voice = koVoice;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = fireEnd;
        utterance.onerror = (e) => {
          if (e.error === "interrupted" || e.error === "canceled") return;
          fireEnd();
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);

        // ── Chrome TTS 15초 컷오프 방지 ──
        // Chrome은 약 15초 이상 TTS가 재생되면 내부적으로 멈춤.
        // 10초마다 pause/resume을 반복해 alive 상태를 유지한다.
        keepAliveRef.current = setInterval(() => {
          if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
          }
        }, 10_000);

        // Safety: 최대 60초 (긴 질문 대응)
        safetyTimerRef.current = setTimeout(() => {
          window.speechSynthesis.cancel();
          fireEnd();
        }, 60_000);
      });
    },
    [isSupported]
  );

  const stop = useCallback(() => {
    if (!isSupported) return;
    clearTimers();
    onEndRef.current = undefined;
    utteranceRef.current = null;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  return { speak, stop, isSpeaking, isSupported };
}
