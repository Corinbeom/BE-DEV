"use client";

import { cn } from "@/lib/utils";

export type AvatarState = "idle" | "speaking" | "listening";

type Props = {
  state: AvatarState;
  className?: string;
};

/**
 * AI 면접관 캐릭터 — 순수 CSS/SVG, 외부 라이브러리 없음.
 * state: "idle" (대기), "speaking" (질문 읽는 중), "listening" (답변 듣는 중)
 */
export function InterviewerAvatar({ state, className }: Props) {
  return (
    <div className={cn("flex flex-col items-center gap-3 select-none", className)}>
      {/* 캐릭터 컨테이너 */}
      <div className="relative">
        {/* 배경 헤일로 (speaking 시 펄스) */}
        {state === "speaking" && (
          <>
            <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-ping" style={{ animationDuration: "2s" }} />
            <div className="absolute inset-0 rounded-full bg-blue-500/5 animate-ping" style={{ animationDuration: "2.5s", animationDelay: "0.5s" }} />
          </>
        )}

        {/* 아바타 SVG */}
        <svg
          viewBox="0 0 120 160"
          width="120"
          height="160"
          className={cn(
            "transition-all duration-500",
            state === "speaking" && "animate-avatar-speaking",
            state === "listening" && "animate-avatar-listening"
          )}
        >
          {/* 데스크 상판 */}
          <rect x="5" y="130" width="110" height="8" rx="4" fill="rgba(255,255,255,0.06)" />
          {/* 데스크 다리 (좌) */}
          <rect x="15" y="138" width="6" height="18" rx="2" fill="rgba(255,255,255,0.04)" />
          {/* 데스크 다리 (우) */}
          <rect x="99" y="138" width="6" height="18" rx="2" fill="rgba(255,255,255,0.04)" />

          {/* 몸통 */}
          <rect x="35" y="90" width="50" height="42" rx="12" fill="rgba(59,130,246,0.18)" />
          {/* 넥타이 */}
          <rect x="57" y="95" width="6" height="20" rx="3" fill="rgba(59,130,246,0.5)" />
          <polygon points="54,115 66,115 60,128" fill="rgba(59,130,246,0.5)" />

          {/* 왼팔 */}
          <rect x="18" y="95" width="20" height="10" rx="5" fill="rgba(59,130,246,0.15)" />
          {/* 왼손 */}
          <ellipse cx="14" cy="106" rx="8" ry="6" fill="rgba(255,255,255,0.12)" />

          {/* 오른팔 */}
          <rect x="82" y="95" width="20" height="10" rx="5" fill="rgba(59,130,246,0.15)" />
          {/* 오른손 */}
          <ellipse cx="106" cy="106" rx="8" ry="6" fill="rgba(255,255,255,0.12)" />

          {/* 목 */}
          <rect x="52" y="78" width="16" height="16" rx="4" fill="rgba(255,255,255,0.12)" />

          {/* 머리 */}
          <ellipse
            cx="60"
            cy="58"
            rx="26"
            ry="28"
            fill="rgba(255,255,255,0.10)"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1"
          />

          {/* 눈 (왼) */}
          <ellipse
            cx="51"
            cy="54"
            rx="4"
            ry={state === "listening" ? "2" : "4"}
            fill="rgba(255,255,255,0.7)"
            className="transition-all duration-300"
          />
          <ellipse cx="51" cy="54" rx="2.5" ry={state === "listening" ? "1.5" : "2.5"} fill="rgb(59,130,246)" />

          {/* 눈 (우) */}
          <ellipse
            cx="69"
            cy="54"
            rx="4"
            ry={state === "listening" ? "2" : "4"}
            fill="rgba(255,255,255,0.7)"
            className="transition-all duration-300"
          />
          <ellipse cx="69" cy="54" rx="2.5" ry={state === "listening" ? "1.5" : "2.5"} fill="rgb(59,130,246)" />

          {/* 입 */}
          {state === "speaking" ? (
            /* 말하는 입 (열린 원) */
            <ellipse cx="60" cy="69" rx="6" ry="4" fill="rgba(255,255,255,0.15)" />
          ) : state === "listening" ? (
            /* 듣는 입 (살짝 미소) */
            <path d="M 53 69 Q 60 73 67 69" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          ) : (
            /* idle — 중립 */
            <line x1="54" y1="69" x2="66" y2="69" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
          )}

          {/* 귀 (좌) */}
          <ellipse cx="34" cy="58" rx="4" ry="6" fill="rgba(255,255,255,0.08)" />
          {/* 귀 (우) */}
          <ellipse cx="86" cy="58" rx="4" ry="6" fill="rgba(255,255,255,0.08)" />

          {/* 머리카락 */}
          <path
            d="M 35 42 Q 40 25 60 22 Q 80 25 85 42"
            fill="rgba(59,130,246,0.35)"
          />
        </svg>

        {/* 말풍선 (speaking 상태) */}
        {state === "speaking" && (
          <div className="absolute -right-2 -top-2 flex size-7 items-center justify-center rounded-full bg-blue-500/20 border border-blue-500/30">
            <div className="flex items-end gap-0.5 h-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-0.5 rounded-full bg-blue-400 animate-sound-bar"
                  style={{ animationDelay: `${i * 0.15}s`, height: "100%" }}
                />
              ))}
            </div>
          </div>
        )}

        {/* 듣기 표시 (listening 상태) */}
        {state === "listening" && (
          <div className="absolute -right-2 -top-2 flex size-7 items-center justify-center rounded-full bg-green-500/15 border border-green-500/25">
            <span className="material-symbols-outlined text-xs text-green-400">hearing</span>
          </div>
        )}
      </div>

      {/* 이름표 */}
      <div className="rounded-lg border border-white/8 bg-white/[0.04] px-4 py-1.5">
        <p className="text-xs font-semibold text-white/60">AI 면접관</p>
      </div>

      {/* 상태 메시지 */}
      <p className="text-[11px] text-white/30 text-center">
        {state === "speaking" && "질문을 읽고 있습니다"}
        {state === "listening" && "답변을 듣고 있습니다"}
        {state === "idle" && "준비 중"}
      </p>
    </div>
  );
}
