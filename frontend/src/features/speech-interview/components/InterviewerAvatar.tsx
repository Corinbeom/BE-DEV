"use client";

export type AvatarState = "idle" | "speaking" | "listening" | "thinking";

type Props = {
  state: AvatarState;
};

const STATE_CONFIG = {
  thinking:  { primary: "var(--speech-warning)", glow: "rgb(var(--speech-warning-rgb) / 0.5)",  ring: "rgb(var(--speech-warning-rgb) / 0.15)", label: "생각하고 있습니다..." },
  speaking:  { primary: "var(--speech-accent)", glow: "rgb(var(--speech-accent-rgb) / 0.5)",  ring: "rgb(var(--speech-accent-rgb) / 0.12)", label: "질문을 읽고 있습니다" },
  listening: { primary: "var(--speech-success)", glow: "rgb(var(--speech-success-rgb) / 0.5)",  ring: "rgb(var(--speech-success-rgb) / 0.12)", label: "답변을 듣고 있습니다" },
  idle:      { primary: "rgb(var(--speech-text-rgb) / 0.3)", glow: "rgb(var(--speech-text-rgb) / 0.08)", ring: "rgb(var(--speech-text-rgb) / 0.05)", label: "대기 중" },
};

function hexPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 30);
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(" ");
}

export function InterviewerAvatar({ state }: Props) {
  const sc = STATE_CONFIG[state];
  const isActive = state !== "idle";

  const glowAnim = state === "speaking" ? "speakGlow 2s ease-in-out infinite"
    : state === "thinking" ? "thinkGlow 2s ease-in-out infinite"
    : state === "listening" ? "listenGlow 2.5s ease-in-out infinite"
    : "none";

  const coreAnim = state === "listening" ? "breathe 2.5s ease-in-out infinite"
    : state === "thinking" ? "breathe 1.4s ease-in-out infinite"
    : "none";

  return (
    <>
      <style>{`
        @keyframes hexSpin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        @keyframes hexSpinRev { 0%{transform:rotate(0deg)} 100%{transform:rotate(-360deg)} }
        @keyframes breathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
        @keyframes speakGlow { 0%,100%{box-shadow:0 0 20px 4px rgb(var(--speech-accent-rgb) / 0.35)} 50%{box-shadow:0 0 40px 12px rgb(var(--speech-accent-rgb) / 0.6)} }
        @keyframes thinkGlow { 0%,100%{box-shadow:0 0 20px 4px rgb(var(--speech-warning-rgb) / 0.3)} 50%{box-shadow:0 0 40px 12px rgb(var(--speech-warning-rgb) / 0.55)} }
        @keyframes listenGlow { 0%,100%{box-shadow:0 0 20px 4px rgb(var(--speech-success-rgb) / 0.3)} 50%{box-shadow:0 0 40px 10px rgb(var(--speech-success-rgb) / 0.5)} }
        @keyframes nodeOrbit { 0%{transform:rotate(0deg) translateX(44px) rotate(0deg)} 100%{transform:rotate(360deg) translateX(44px) rotate(-360deg)} }
        @keyframes nodeOrbit2 { 0%{transform:rotate(120deg) translateX(44px) rotate(-120deg)} 100%{transform:rotate(480deg) translateX(44px) rotate(-480deg)} }
        @keyframes nodeOrbit3 { 0%{transform:rotate(240deg) translateX(44px) rotate(-240deg)} 100%{transform:rotate(600deg) translateX(44px) rotate(-480deg)} }
        @keyframes recDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.3;transform:scale(0.7)} }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        {/* 노드 비주얼 */}
        <div style={{ position: "relative", width: 160, height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* 바깥 육각형 링 — 천천히 회전 */}
          <svg
            width={160} height={160} viewBox="0 0 160 160"
            style={{ position: "absolute", inset: 0, animation: isActive ? "hexSpin 12s linear infinite" : "none", opacity: isActive ? 1 : 0.3 }}
          >
            <polygon points={hexPoints(80, 80, 72)} fill="none" stroke={sc.primary} strokeWidth="1" strokeOpacity="0.3" strokeDasharray="4 6" />
          </svg>

          {/* 안쪽 육각형 링 — 반대 방향 */}
          <svg
            width={160} height={160} viewBox="0 0 160 160"
            style={{ position: "absolute", inset: 0, animation: isActive ? "hexSpinRev 8s linear infinite" : "none", opacity: isActive ? 1 : 0.2 }}
          >
            <polygon points={hexPoints(80, 80, 56)} fill="none" stroke={sc.primary} strokeWidth="1" strokeOpacity="0.5" />
          </svg>

          {/* 궤도 도트 (THINKING 전용) */}
          {state === "thinking" && (
            <>
              {[
                { anim: "nodeOrbit 2.2s linear infinite" },
                { anim: "nodeOrbit2 2.2s linear infinite" },
                { anim: "nodeOrbit3 2.2s linear infinite" },
              ].map((o, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute", top: "50%", left: "50%",
                    marginTop: -4, marginLeft: -4,
                    width: 8, height: 8, borderRadius: "50%",
                    background: "var(--speech-warning)",
                    animation: o.anim, opacity: 0.8,
                  }}
                />
              ))}
            </>
          )}

          {/* 코어 서클 */}
          <div
            style={{
              width: 88, height: 88, borderRadius: "50%",
              background: `radial-gradient(circle at 35% 35%, ${sc.primary}40, ${sc.primary}15 60%, transparent)`,
              border: `1.5px solid ${sc.primary}60`,
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: [glowAnim, coreAnim].filter(a => a !== "none").join(", ") || "none",
              position: "relative", zIndex: 2,
              backdropFilter: "blur(4px)",
            }}
          >
            {/* 내부 글로우 링 */}
            <div style={{ width: 60, height: 60, borderRadius: "50%", border: `1px solid ${sc.primary}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width={28} height={28} viewBox="0 0 28 28">
                {state === "thinking" && (
                  <>
                    <circle cx="14" cy="14" r="5" fill={sc.primary} opacity="0.9" />
                    <circle cx="14" cy="14" r="9" fill="none" stroke={sc.primary} strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.6" />
                  </>
                )}
                {state === "speaking" && (
                  <>
                    <circle cx="14" cy="14" r="4" fill={sc.primary} />
                    {[8, 11, 14].map((r, i) => (
                      <circle key={i} cx="14" cy="14" r={r} fill="none" stroke={sc.primary} strokeWidth="0.8" strokeOpacity={0.6 - i * 0.15} />
                    ))}
                  </>
                )}
                {state === "listening" && (
                  <>
                    <circle cx="14" cy="14" r="4" fill={sc.primary} opacity="0.9" />
                    <path d="M 7 14 Q 14 7 21 14 Q 14 21 7 14" fill="none" stroke={sc.primary} strokeWidth="1" strokeOpacity="0.6" />
                  </>
                )}
                {state === "idle" && (
                  <circle cx="14" cy="14" r="4" fill="rgb(var(--speech-text-rgb) / 0.3)" />
                )}
              </svg>
            </div>
          </div>

          {/* SPEAKING: 확장하는 음파 링 */}
          {state === "speaking" && [1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                position: "absolute", borderRadius: "50%",
                border: `1px solid ${sc.primary}`,
                animation: `breathe ${1.2 + i * 0.4}s ease-in-out infinite ${i * 0.3}s`,
                width: 88 + i * 22, height: 88 + i * 22,
                opacity: 0.15 + (3 - i) * 0.08,
                zIndex: 1,
              }}
            />
          ))}

          {/* LISTENING: 부드러운 펄스 링 */}
          {state === "listening" && (
            <div
              style={{
                position: "absolute", borderRadius: "50%",
                border: `1.5px solid ${sc.primary}50`,
                width: 112, height: 112,
                animation: "breathe 2.5s ease-in-out infinite",
                zIndex: 1,
              }}
            />
          )}
        </div>

        {/* 레이블 */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "rgb(var(--speech-text-rgb) / 0.5)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "monospace", marginBottom: 5 }}>
            AI 면접관
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: sc.primary, animation: isActive ? "recDot 1.5s ease-in-out infinite" : "none" }} />
            <span style={{ fontSize: 13, color: sc.primary, fontWeight: 500 }}>{sc.label}</span>
          </div>
        </div>
      </div>
    </>
  );
}
