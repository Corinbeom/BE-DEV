"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { SpeechInterviewQuestion } from "../api/types";
import type { SpeechRecognitionHook } from "../hooks/useSpeechRecognition";
import type { BehavioralMetrics } from "../hooks/useBehavioralAnalysis";
import { cn } from "@/lib/utils";

const ANSWER_TIMEOUT_SEC = 120;

type Props = {
  question: SpeechInterviewQuestion;
  questionIndex: number;
  totalQuestions: number;
  stt: SpeechRecognitionHook;
  useCamera: boolean;
  getMetrics: () => BehavioralMetrics | null;
  onSubmit: (answerText: string) => void;
};

export function InterviewAnswering({ question, questionIndex, totalQuestions, stt, useCamera, getMetrics, onSubmit }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [textFallback, setTextFallback] = useState("");
  const [timeLeft, setTimeLeft] = useState(ANSWER_TIMEOUT_SEC);
  const [submitted, setSubmitted] = useState(false);
  const [metrics, setMetrics] = useState<BehavioralMetrics | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const metricsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!useCamera) return;
    metricsTimerRef.current = setInterval(() => {
      setMetrics(getMetrics());
    }, 1000);
    return () => { if (metricsTimerRef.current) clearInterval(metricsTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useCamera]);

  useEffect(() => {
    stt.resetTranscript();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      stt.stop();
      if (timerRef.current) clearInterval(timerRef.current);
      if (metricsTimerRef.current) clearInterval(metricsTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = useCallback(() => {
    if (stt.isSupported) {
      stt.resetTranscript();
      stt.start();
    }
    setIsRecording(true);
  }, [stt]);

  const stopRecording = useCallback(() => {
    stt.stop();
    setIsRecording(false);
  }, [stt]);

  const submittedRef = useRef(false);
  const handleSubmit = useCallback((isTimeout = false) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitted(true);
    stt.stop();
    if (timerRef.current) clearInterval(timerRef.current);

    const finalText = stt.isSupported
      ? (stt.transcript + stt.interimTranscript).trim()
      : textFallback.trim();

    if (!finalText && !isTimeout) {
      submittedRef.current = false;
      setSubmitted(false);
      return;
    }
    onSubmit(finalText || "(답변 없음)");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stt, textFallback, onSubmit]);

  const timerPct = (timeLeft / ANSWER_TIMEOUT_SEC) * 100;
  const isUrgent = timeLeft <= 30;
  const displayText = stt.isSupported
    ? (stt.transcript + (stt.interimTranscript || ""))
    : textFallback;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 py-12">
      <div className="flex items-center gap-2">
        <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/50">
          {questionIndex + 1} / {totalQuestions}
        </span>
        <span className="rounded-full bg-green-500/10 border border-green-500/20 px-3 py-1 text-xs font-semibold text-green-400">
          답변 시간
        </span>
      </div>

      <div className="w-full max-w-2xl rounded-xl border border-white/8 bg-white/[0.03] px-5 py-4">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/30">{question.badge}</p>
        <p className="text-sm font-medium leading-relaxed text-white/75">
          {question.questionText}
        </p>
      </div>

      <div className="flex w-full max-w-2xl items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex size-12 items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
              <circle
                cx="24" cy="24" r="20"
                fill="none"
                stroke={isUrgent ? "rgb(239,68,68)" : "rgb(59,130,246)"}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 20}`}
                strokeDashoffset={`${2 * Math.PI * 20 * (1 - timerPct / 100)}`}
                style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
              />
            </svg>
            <span className={cn("text-xs font-bold tabular-nums", isUrgent ? "text-red-400" : "text-white/60")}>
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
            </span>
          </div>
          <span className="text-xs text-white/30">남은 시간</span>
        </div>

        {useCamera && metrics && (
          <div className="flex items-center gap-3">
            <BehavioralIndicator icon="visibility" label="시선" value={metrics.eyeContactRatio} thresholdGood={0.65} thresholdWarn={0.45} />
            <BehavioralIndicator icon="self_improvement" label="자세" value={metrics.postureStability} thresholdGood={0.7} thresholdWarn={0.5} />
            <BehavioralIndicator icon="personal_injury" label="안정" value={1 - metrics.fidgetingScore} thresholdGood={0.6} thresholdWarn={0.4} />
          </div>
        )}
      </div>

      <div className="w-full max-w-2xl">
        {stt.isSupported ? (
          <div className={cn(
            "min-h-36 rounded-2xl border p-5 transition-all duration-300",
            isRecording
              ? "border-green-500/30 bg-green-500/[0.04] ring-1 ring-green-500/20"
              : "border-white/8 bg-white/[0.03]"
          )}>
            <div className="mb-3 flex items-center gap-2">
              {isRecording ? (
                <div className="flex items-center gap-1.5">
                  <span className="size-1.5 animate-pulse rounded-full bg-red-400" />
                  <span className="text-xs font-semibold text-red-400">녹음 중</span>
                </div>
              ) : (
                <span className="text-xs text-white/20">
                  {displayText ? "녹음 완료 — 내용을 확인하고 제출하세요" : "녹음 버튼을 눌러 답변을 시작하세요"}
                </span>
              )}
            </div>
            {displayText ? (
              <p className="text-sm leading-relaxed text-white/80">
                {stt.transcript}
                {stt.interimTranscript && <span className="text-white/35">{stt.interimTranscript}</span>}
              </p>
            ) : (
              <p className="text-sm text-white/20 italic">
                {isRecording ? "음성을 인식하고 있습니다..." : "여기에 음성이 텍스트로 표시됩니다..."}
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <p className="mb-2 text-xs text-amber-400/80">
              이 브라우저는 음성 인식을 지원하지 않습니다. 텍스트로 답변해 주세요.
            </p>
            <textarea
              value={textFallback}
              onChange={(e) => setTextFallback(e.target.value)}
              placeholder="답변을 입력하세요..."
              rows={5}
              className="w-full resize-none bg-transparent text-sm text-white/80 outline-none placeholder:text-white/20"
            />
          </div>
        )}
      </div>

      <div className="flex w-full max-w-2xl gap-3">
        {stt.isSupported && (
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={submitted}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl py-4 text-sm font-bold transition-all",
              submitted
                ? "cursor-not-allowed bg-white/5 text-white/20"
                : isRecording
                ? "bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25"
                : "bg-white/8 border border-white/15 text-white/70 hover:bg-white/12"
            )}
          >
            <span className="material-symbols-outlined text-sm">
              {isRecording ? "stop_circle" : "mic"}
            </span>
            {isRecording ? "녹음 중지" : "녹음 시작"}
          </button>
        )}

        <button
          onClick={() => handleSubmit(false)}
          disabled={submitted || (!displayText && !stt.isSupported)}
          className={cn(
            "flex flex-[2] items-center justify-center gap-2 rounded-xl py-4 text-sm font-bold transition-all",
            submitted
              ? "cursor-not-allowed bg-white/5 text-white/20"
              : displayText || !stt.isSupported
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500"
              : "cursor-not-allowed bg-white/5 text-white/20"
          )}
        >
          <span className="material-symbols-outlined text-sm">check_circle</span>
          {submitted ? "제출 중..." : "답변 완료"}
        </button>
      </div>
    </div>
  );
}

function BehavioralIndicator({ icon, label, value, thresholdGood, thresholdWarn }: {
  icon: string; label: string; value: number; thresholdGood: number; thresholdWarn: number;
}) {
  const color = value >= thresholdGood ? "text-green-400" : value >= thresholdWarn ? "text-amber-400" : "text-red-400";
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={cn("material-symbols-outlined text-sm", color)}>{icon}</span>
      <span className={cn("text-[10px] font-semibold", color)}>{Math.round(value * 100)}%</span>
      <span className="text-[9px] text-white/25">{label}</span>
    </div>
  );
}
