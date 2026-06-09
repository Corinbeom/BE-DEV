"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionConstructor = new () => any;

function getSpeechRecognitionClass(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition ?? null;
}

export type SpeechRecognitionHook = {
  start: () => void;
  stop: () => void;
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  resetTranscript: () => void;
};

export function useSpeechRecognition(): SpeechRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isSupported] = useState(() => getSpeechRecognitionClass() !== null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const isStoppingRef = useRef(false);
  // transcript ref: onend 클로저에서 최신값 접근용
  const transcriptRef = useRef("");

  useEffect(() => {
    return () => {
      isStoppingRef.current = true;
      recognitionRef.current?.abort();
    };
  }, []);

  /**
   * 새 SpeechRecognition 인스턴스를 생성해 시작.
   * Chrome은 같은 인스턴스에 start()를 재호출할 수 없으므로
   * onend 재시작 시 반드시 새 인스턴스를 만들어야 한다.
   */
  const createAndStart = useCallback(() => {
    const RecognitionClass = getSpeechRecognitionClass();
    if (!RecognitionClass || isStoppingRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition: any = new RecognitionClass();
    recognition.lang = "ko-KR";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let final = "";
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) final += res[0].transcript;
        else interim += res[0].transcript;
      }
      if (final) {
        transcriptRef.current += final;
        setTranscript(transcriptRef.current);
      }
      setInterimTranscript(interim);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      // "aborted": stop()으로 인한 정상 중단
      if (event.error === "aborted" || event.error === "no-speech") return;
      // 다른 에러(network, not-allowed 등)는 리스닝 중단
      setIsListening(false);
      setInterimTranscript("");
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");

      // 명시적 stop() 호출이 아니면 새 인스턴스로 자동 재시작
      if (!isStoppingRef.current && recognitionRef.current === recognition) {
        setTimeout(() => {
          if (!isStoppingRef.current) createAndStart();
        }, 200);
      }
    };

    try {
      recognition.start();
    } catch {
      setIsListening(false);
    }
  // createAndStart 는 deps 없이 stable reference 유지 (isStoppingRef, recognitionRef는 ref)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = useCallback(() => {
    if (!getSpeechRecognitionClass()) return;
    // 이전 인스턴스 중단
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    isStoppingRef.current = false;
    createAndStart();
  }, [createAndStart]);

  const stop = useCallback(() => {
    isStoppingRef.current = true;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript("");
  }, []);

  const resetTranscript = useCallback(() => {
    transcriptRef.current = "";
    setTranscript("");
    setInterimTranscript("");
  }, []);

  return { start, stop, isListening, isSupported, transcript, interimTranscript, resetTranscript };
}
