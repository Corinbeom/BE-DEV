"use client";

import { useCallback, useRef, useState } from "react";
import type { SpeechRecognitionHook } from "./useSpeechRecognition";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
const INTERVAL_MS = 4000;

function detectMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) return "audio/webm;codecs=opus";
  if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
  if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) return "audio/ogg;codecs=opus";
  return "";
}

export function useGroqStt(): SpeechRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(() =>
    typeof navigator !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia
  );

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const sendChunks = useCallback(async () => {
    if (chunksRef.current.length === 0) return;
    const mimeType = mediaRecorderRef.current?.mimeType ?? "audio/webm";
    const blob = new Blob(chunksRef.current, { type: mimeType });
    // 너무 작은 블롭은 전송하지 않음 (빈 chunk 방어)
    if (blob.size < 100) return;

    const formData = new FormData();
    formData.append("audio", blob, "audio.webm");

    try {
      const res = await fetch(`${API_BASE}/api/stt/transcribe`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) return;
      const json = await res.json();
      const text: string = json?.data?.text ?? "";
      if (text) {
        setTranscript(text);
      }
    } catch {
      // STT 실패는 면접 흐름을 방해하지 않음 — 무시
    }
  }, []);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = detectMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(1000); // 1초 슬라이스로 chunk 수집
      intervalRef.current = setInterval(sendChunks, INTERVAL_MS);
      setIsListening(true);
    } catch {
      // 마이크 권한 거부 등 — 텍스트 폴백으로 전환
      setIsSupported(false);
    }
  }, [sendChunks]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const recorder = mediaRecorderRef.current;
    mediaRecorderRef.current = null;

    if (recorder && recorder.state !== "inactive") {
      // onstop은 마지막 ondataavailable 이후에 발화하므로
      // 여기서 sendChunks() 하면 최종 chunk까지 포함됨
      recorder.onstop = () => {
        sendChunks();
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };
      recorder.stop();
    } else {
      sendChunks();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    setIsListening(false);
  }, [sendChunks]);

  const resetTranscript = useCallback(() => {
    chunksRef.current = [];
    setTranscript("");
  }, []);

  return {
    start,
    stop,
    isListening,
    isSupported,
    transcript,
    interimTranscript: "",
    resetTranscript,
  };
}
