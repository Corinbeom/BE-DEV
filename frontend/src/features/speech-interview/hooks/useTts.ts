"use client";

import { useCallback, useRef, useState } from "react";
import { apiBaseUrl } from "@/lib/api";
import type { SpeechSynthesisHook } from "./useSpeechSynthesis";

export function useTts(): SpeechSynthesisHook {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isError, setIsError] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const onEndRef = useRef<(() => void) | undefined>(undefined);

  const cleanup = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }, []);

  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      console.log("[useTts] speak() 호출:", text.slice(0, 30));
      cleanup();
      setIsSpeaking(true);
      setIsError(false);
      onEndRef.current = onEnd;

      const controller = new AbortController();
      abortRef.current = controller;

      fetch(`${apiBaseUrl()}/api/tts/speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text }),
        signal: controller.signal,
      })
        .then((res) => {
          console.log("[useTts] fetch 완료 status:", res.status);
          if (!res.ok) throw new Error(`TTS 오류: ${res.status}`);
          return res.blob();
        })
        .then((blob) => {
          console.log("[useTts] blob 수신:", blob.size, "bytes, type:", blob.type);
          if (controller.signal.aborted) {
            console.log("[useTts] signal aborted, 재생 취소");
            return;
          }
          // Content-Type 명시적 지정
          const wavBlob = new Blob([blob], { type: "audio/wav" });
          const url = URL.createObjectURL(wavBlob);
          blobUrlRef.current = url;

          const audio = new Audio();
          audio.src = url;
          audioRef.current = audio;

          const fireEnd = () => {
            console.log("[useTts] 재생 완료");
            setIsSpeaking(false);
            const cb = onEndRef.current;
            onEndRef.current = undefined;
            cb?.();
            cleanup();
          };

          audio.onended = fireEnd;
          audio.onerror = (e) => {
            console.warn("[useTts] audio.onerror:", e);
            fireEnd();
          };

          console.log("[useTts] audio.play() 시도");
          audio.play().then(() => {
            console.log("[useTts] audio.play() 성공");
          }).catch((err: Error) => {
            console.warn("[useTts] audio.play() 실패:", err.name, err.message);
            setIsSpeaking(false);
            cleanup();
          });
        })
        .catch((err: Error) => {
          if (err.name === "AbortError") {
            console.log("[useTts] fetch AbortError (정상)");
            return;
          }
          console.warn("[useTts] fetch 실패:", err.name, err.message);
          setIsSpeaking(false);
          setIsError(true);
          const cb = onEndRef.current;
          onEndRef.current = undefined;
          cb?.();
        });
    },
    [cleanup]
  );

  const stop = useCallback(() => {
    console.log("[useTts] stop() 호출");
    onEndRef.current = undefined;
    cleanup();
    setIsSpeaking(false);
  }, [cleanup]);

  return { speak, stop, isSpeaking, isSupported: true, isError };
}
