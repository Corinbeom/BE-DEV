"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { apiBaseUrl } from "@/lib/api";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

/* ── Brand Colors (RGB tuples) ── */

const DEEP_NAVY: [number, number, number] = [10, 22, 40]; // #0a1628
const MID_NAVY: [number, number, number] = [15, 36, 64]; // #0f2440
const MID_BLUE: [number, number, number] = [30, 58, 95]; // #1e3a5f
const ELECTRIC_BLUE: [number, number, number] = [37, 99, 235]; // #2563eb
const SKY_BLUE: [number, number, number] = [125, 211, 252]; // #7dd3fc
const LIGHT_SKY: [number, number, number] = [186, 230, 253]; // #bae6fd

/* ── Color Interpolation ── */

function lerpColor(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): string {
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;
}

function getGradientColors(p: number): { top: string; bottom: string } {
  if (p <= 0.4) {
    const t = p / 0.4;
    return {
      top: lerpColor(DEEP_NAVY, MID_BLUE, t),
      bottom: lerpColor(MID_NAVY, ELECTRIC_BLUE, t),
    };
  }
  if (p <= 0.7) {
    const t = (p - 0.4) / 0.3;
    return {
      top: lerpColor(MID_BLUE, ELECTRIC_BLUE, t),
      bottom: lerpColor(ELECTRIC_BLUE, SKY_BLUE, t),
    };
  }
  const t = (p - 0.7) / 0.3;
  return {
    top: lerpColor(ELECTRIC_BLUE, SKY_BLUE, t),
    bottom: lerpColor(SKY_BLUE, LIGHT_SKY, t),
  };
}

/* ── Star Data (static) ── */

const STARS = [
  { top: "8%", left: "12%", size: 2, dur: "3s", delay: "0s" },
  { top: "5%", left: "45%", size: 3, dur: "4s", delay: "1.2s" },
  { top: "15%", left: "78%", size: 2, dur: "3.5s", delay: "0.5s" },
  { top: "22%", left: "30%", size: 1.5, dur: "2.8s", delay: "2s" },
  { top: "3%", left: "88%", size: 2.5, dur: "4.5s", delay: "0.8s" },
  { top: "18%", left: "60%", size: 1.5, dur: "3.2s", delay: "1.5s" },
  { top: "10%", left: "25%", size: 2, dur: "3.8s", delay: "2.3s" },
  { top: "7%", left: "70%", size: 1.5, dur: "2.5s", delay: "0.3s" },
  { top: "25%", left: "50%", size: 2, dur: "4.2s", delay: "1.8s" },
  { top: "12%", left: "92%", size: 1.5, dur: "3.6s", delay: "0.7s" },
];

/* ── Feature Data ── */

const FEATURES = [
  {
    icon: "description",
    title: "AI 이력서 분석",
    subtitle: "맞춤 면접 질문 생성",
    desc: "이력서와 포트폴리오를 업로드하면 AI가 내용을 분석하여 실제 면접에서 나올 수 있는 맞춤형 질문을 생성합니다.",
    points: [
      "PDF · 포트폴리오 업로드 지원",
      "직무별 맞춤 면접 질문 생성",
      "AI 모범 답변 및 피드백 제공",
    ],
  },
  {
    icon: "smart_toy",
    title: "CS 퀴즈",
    subtitle: "체계적 CS 지식 점검",
    desc: "자료구조, 알고리즘, 네트워크, 운영체제 등 9개 토픽의 CS 지식을 난이도별로 점검하고 학습할 수 있습니다.",
    points: [
      "9개 CS 토픽 · 3단계 난이도",
      "객관식 · 주관식 문제 지원",
      "AI 생성 해설 및 오답 분석",
    ],
  },
  {
    icon: "work",
    title: "지원 현황 트래커",
    subtitle: "채용 과정 한눈에 관리",
    desc: "서류 준비부터 최종 합격까지, 모든 채용 과정을 단계별로 관리하고 메모를 남길 수 있습니다.",
    points: [
      "칸반 보드 스타일 단계 관리",
      "기업별 메모 · 일정 기록",
      "지원 현황 통계 대시보드",
    ],
  },
];

/* ── CSS Mockup Components ── */

function ResumeMockup() {
  return (
    <div className="w-full max-w-xs overflow-hidden rounded-xl border border-white/10 bg-white/10 shadow-xl backdrop-blur-md sm:max-w-sm">
      <MockupTitleBar title="이력서 분석" />
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-2 rounded-lg bg-white/10 p-2.5">
          <span className="material-symbols-outlined text-lg text-blue-300">
            upload_file
          </span>
          <span className="text-xs font-medium text-white/90">
            사용자이름_이력서.pdf
          </span>
          <span className="ml-auto rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-medium text-green-300">
            분석 완료
          </span>
        </div>
        <div className="space-y-2">
          {[
            "프로젝트에서 본인의 핵심 기여는?",
            "기술 스택 선택의 근거는?",
            "가장 어려웠던 기술적 문제는?",
          ].map((q, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-lg border border-white/10 p-2.5"
            >
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-400/20 text-[10px] font-bold text-blue-300">
                {i + 1}
              </span>
              <span className="text-xs leading-relaxed text-white/80">
                {q}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-blue-300">
          <span className="material-symbols-outlined text-sm">
            auto_awesome
          </span>
          AI가 3개 맞춤 질문을 생성했습니다
        </div>
      </div>
    </div>
  );
}

function QuizMockup() {
  return (
    <div className="w-full max-w-xs overflow-hidden rounded-xl border border-white/10 bg-white/10 shadow-xl backdrop-blur-md sm:max-w-sm">
      <MockupTitleBar title="CS 퀴즈" />
      <div className="flex flex-wrap gap-1.5 border-b border-white/10 px-4 py-2.5">
        {["자료구조", "네트워크", "OS", "DB"].map((t, i) => (
          <span
            key={t}
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              i === 0
                ? "bg-blue-500 text-white"
                : "bg-white/10 text-white/60"
            }`}
          >
            {t}
          </span>
        ))}
      </div>
      <div className="space-y-3 p-4">
        <div className="text-xs font-semibold text-white/90">
          Q. HashMap의 평균 시간복잡도는?
        </div>
        <div className="space-y-1.5">
          {["O(1)", "O(n)", "O(log n)", "O(n²)"].map((opt, i) => (
            <div
              key={opt}
              className={`flex items-center gap-2 rounded-lg border p-2 text-xs text-white/80 ${
                i === 0
                  ? "border-blue-400 bg-blue-400/10"
                  : "border-white/10"
              }`}
            >
              <div
                className={`flex size-3.5 items-center justify-center rounded-full border-2 ${
                  i === 0 ? "border-blue-400" : "border-white/20"
                }`}
              >
                {i === 0 && (
                  <div className="size-1.5 rounded-full bg-blue-400" />
                )}
              </div>
              {opt}
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <div className="rounded-md bg-blue-500 px-3 py-1.5 text-[10px] font-medium text-white">
            제출하기
          </div>
        </div>
      </div>
    </div>
  );
}

function TrackerMockup() {
  const columns = [
    {
      stage: "서류 준비",
      bg: "bg-white/5",
      items: [
        { name: "카카오", bg: "bg-yellow-400/10" },
        { name: "라인", bg: "bg-green-400/10" },
      ],
    },
    {
      stage: "진행 중",
      bg: "bg-blue-400/10",
      items: [{ name: "네이버", bg: "bg-green-400/10" }],
    },
    {
      stage: "합격",
      bg: "bg-emerald-400/10",
      items: [{ name: "토스", bg: "bg-blue-400/10" }],
    },
  ];

  return (
    <div className="w-full max-w-xs overflow-hidden rounded-xl border border-white/10 bg-white/10 shadow-xl backdrop-blur-md sm:max-w-sm">
      <MockupTitleBar title="지원 현황" />
      <div className="grid grid-cols-3 gap-2 p-3">
        {columns.map((col) => (
          <div key={col.stage} className="space-y-1.5">
            <div
              className={`rounded-md px-2 py-1 text-center text-[10px] font-semibold text-white/80 ${col.bg}`}
            >
              {col.stage}
            </div>
            {col.items.map((item) => (
              <div
                key={item.name}
                className={`rounded-lg border border-white/10 ${item.bg} p-2 text-[11px] font-medium text-white/80`}
              >
                {item.name}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-white/10 px-4 py-2.5">
        <span className="text-[10px] text-white/50">총 4건 지원</span>
        <span className="text-[10px] font-medium text-blue-300">
          합격률 25%
        </span>
      </div>
    </div>
  );
}

function MockupTitleBar({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2.5">
      <div className="size-2.5 rounded-full bg-red-400" />
      <div className="size-2.5 rounded-full bg-yellow-400" />
      <div className="size-2.5 rounded-full bg-green-400" />
      <span className="ml-2 text-[11px] text-white/50">{title}</span>
    </div>
  );
}

const MOCKUPS = [ResumeMockup, QuizMockup, TrackerMockup];

/* ── Main Page ── */

export default function LoginPage() {
  const { user, isLoading, serverStatus, retryConnection } = useAuth();
  const router = useRouter();
  const loginSectionRef = useRef<HTMLElement>(null);
  const featureContainerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [activeFeature, setActiveFeature] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Mouse-following grid spotlight
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (gridRef.current) {
      gridRef.current.style.setProperty("--mx", `${e.clientX}px`);
      gridRef.current.style.setProperty("--my", `${e.clientY}px`);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  // Scroll progress tracking (0~1)
  useEffect(() => {
    const handleBgScroll = () => {
      const total = document.body.scrollHeight - window.innerHeight;
      if (total <= 0) return;
      setScrollProgress(Math.min(1, window.scrollY / total));
    };
    window.addEventListener("scroll", handleBgScroll, { passive: true });
    handleBgScroll();
    return () => window.removeEventListener("scroll", handleBgScroll);
  }, []);

  // Sticky scroll — track which feature is active
  useEffect(() => {
    const handleScroll = () => {
      if (!featureContainerRef.current) return;
      const rect = featureContainerRef.current.getBoundingClientRect();
      const totalScroll =
        featureContainerRef.current.offsetHeight - window.innerHeight;
      if (totalScroll <= 0) return;

      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(0.999, scrolled / totalScroll));
      setActiveFeature(Math.floor(progress * 3));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Compute gradient colors
  const { top: topColor, bottom: bottomColor } = useMemo(
    () => getGradientColors(scrollProgress),
    [scrollProgress],
  );

  // Text color transitions
  const heroTextColor = useMemo(() => {
    if (scrollProgress < 0.5) return "rgba(255,255,255,0.95)";
    const t = (scrollProgress - 0.5) / 0.5;
    const r = Math.round(255 - t * 230);
    const g = Math.round(255 - t * 230);
    const b = Math.round(255 - t * 230);
    return `rgba(${r},${g},${b},0.95)`;
  }, [scrollProgress]);

  const heroSubTextColor = useMemo(() => {
    if (scrollProgress < 0.5) return "rgba(255,255,255,0.7)";
    const t = (scrollProgress - 0.5) / 0.5;
    const r = Math.round(255 - t * 180);
    const g = Math.round(255 - t * 180);
    const b = Math.round(255 - t * 180);
    return `rgba(${r},${g},${b},0.7)`;
  }, [scrollProgress]);

  // Star opacity (fade out as background brightens)
  const starOpacity = useMemo(
    () => Math.max(0, 1 - scrollProgress * 2),
    [scrollProgress],
  );

  /* ── Early-return states (unchanged) ── */

  if (serverStatus === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">
          progress_activity
        </span>
      </div>
    );
  }

  if (serverStatus === "warming") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
          <span className="material-symbols-outlined animate-spin text-3xl">
            progress_activity
          </span>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground">
            서버가 시작되고 있습니다
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            첫 접속 시 30~60초 정도 소요될 수 있어요.
          </p>
        </div>
        <div className="h-1.5 w-48 overflow-hidden rounded-full bg-muted">
          <div className="animate-progress-indeterminate h-full rounded-full bg-primary" />
        </div>
      </div>
    );
  }

  if (serverStatus === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-destructive text-white shadow-lg shadow-destructive/25">
          <span className="material-symbols-outlined text-3xl">cloud_off</span>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground">
            서버에 연결할 수 없습니다
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            잠시 후 다시 시도해 주세요.
          </p>
        </div>
        <Button onClick={retryConnection}>다시 연결</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">
          progress_activity
        </span>
      </div>
    );
  }

  if (user) return null;

  const backendUrl = apiBaseUrl();

  const scrollToLogin = () => {
    loginSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToFeature = (index: number) => {
    if (!featureContainerRef.current) return;
    const totalScroll =
      featureContainerRef.current.offsetHeight - window.innerHeight;
    const targetY =
      featureContainerRef.current.offsetTop + (index / 3) * totalScroll + 1;
    window.scrollTo({ top: targetY, behavior: "smooth" });
  };

  return (
    <div
      className="relative"
      style={{
        background: `linear-gradient(to bottom, ${topColor}, ${bottomColor})`,
        transition: "background 0.1s ease-out",
      }}
    >
      {/* ── Stars (night sky) ── */}
      <div
        className="pointer-events-none fixed inset-0 z-10"
        style={{ opacity: starOpacity, transition: "opacity 0.3s ease-out" }}
      >
        {STARS.map((star, i) => (
          <div
            key={i}
            className="bluehour-star"
            style={{
              top: star.top,
              left: star.left,
              width: `${star.size}px`,
              height: `${star.size}px`,
              "--dur": star.dur,
              "--delay": star.delay,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* ── Grid pattern — follows mouse cursor ── */}
      <div
        ref={gridRef}
        className="pointer-events-none fixed inset-0 opacity-40"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
          mask: "radial-gradient(circle 280px at var(--mx, -200px) var(--my, -200px), black 0%, transparent 100%)",
          WebkitMask:
            "radial-gradient(circle 280px at var(--mx, -200px) var(--my, -200px), black 0%, transparent 100%)",
        }}
      />

      {/* ── Decorative gradient blobs ── */}
      <div
        className="pointer-events-none fixed -top-32 -right-32 size-[500px] rounded-full blur-3xl"
        style={{
          background: `rgba(37,99,235,${0.08 + scrollProgress * 0.05})`,
        }}
      />
      <div
        className="pointer-events-none fixed top-1/2 -left-48 size-[440px] rounded-full blur-3xl"
        style={{
          background: `rgba(37,99,235,${0.1 + scrollProgress * 0.05})`,
        }}
      />
      <div
        className="pointer-events-none fixed right-1/4 bottom-1/4 size-[300px] rounded-full blur-3xl"
        style={{
          background: `rgba(186,230,253,${scrollProgress * 0.08})`,
        }}
      />

      {/* ── Warm Gold Glow (sunrise) ── */}
      {scrollProgress > 0.6 && (
        <div
          className="pointer-events-none fixed bottom-0 left-1/2 z-10 -translate-x-1/2"
          style={{
            width: "600px",
            height: "300px",
            background: `radial-gradient(ellipse, rgba(245,158,11,${(scrollProgress - 0.6) * 0.5}) 0%, transparent 70%)`,
          }}
        />
      )}

      {/* ── Section 1: Hero ── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6">
        <div className="flex flex-col items-center text-center animate-in fade-in duration-700">
          <Image
            src="/logos/bluehour-wordmark-white.png"
            alt="Bluehour"
            width={280}
            height={70}
            className="mb-5"
            priority
          />
          <h1
            className="text-3xl font-bold tracking-tight sm:text-4xl"
            style={{ color: heroTextColor }}
          >
            Before Your Sunrise
          </h1>
          <p
            className="mt-3 max-w-lg text-base sm:text-lg"
            style={{ color: heroSubTextColor }}
          >
            당신의 아침이 시작되는 곳
            <br className="hidden sm:block" />
            이력서 분석, CS 퀴즈, 지원 현황 관리까지
          </p>
        </div>

        <div className="mt-14 flex flex-col items-center gap-3 animate-in fade-in duration-700 delay-300 fill-mode-both">
          <Button
            variant="default"
            size="lg"
            className="gap-2 border-white/20 bg-white/15 px-8 text-base text-white backdrop-blur-sm hover:bg-white/25"
            onClick={scrollToLogin}
          >
            시작하기
            <span className="material-symbols-outlined text-xl">
              arrow_downward
            </span>
          </Button>
        </div>

        <span
          className="material-symbols-outlined absolute bottom-10 animate-bounce text-2xl"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          keyboard_arrow_down
        </span>
      </section>

      {/* ── Section 2: Sticky Feature Showcase ── */}
      <div ref={featureContainerRef} style={{ height: "280vh" }}>
        <div className="sticky top-0 flex h-screen flex-col overflow-hidden">
          <div className="mx-auto flex w-full flex-1 max-w-6xl flex-col items-center gap-8 px-6 md:flex-row md:gap-12 lg:gap-20">
            {/* Left: Progress indicator + Text */}
            <div className="flex w-full flex-1 flex-col items-center md:items-start">
              {/* Mobile progress dots */}
              <div className="mb-6 flex gap-2 md:hidden">
                {FEATURES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => scrollToFeature(i)}
                    className={`h-1.5 rounded-full transition-all duration-150 ${
                      i === activeFeature
                        ? "w-8 bg-white"
                        : "w-1.5 bg-white/30"
                    }`}
                  />
                ))}
              </div>

              {/* Desktop progress stepper */}
              <div className="mb-12 hidden flex-col gap-3 md:flex">
                {FEATURES.map((f, i) => (
                  <button
                    key={f.icon}
                    onClick={() => scrollToFeature(i)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-all duration-150 ${
                      i === activeFeature
                        ? "bg-white/15"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <div
                      className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-150 ${
                        i === activeFeature
                          ? "bg-white text-[#0a1628]"
                          : i < activeFeature
                            ? "bg-white/30 text-white"
                            : "bg-white/10 text-white/50"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <span
                      className={`text-sm transition-colors duration-150 ${
                        i === activeFeature
                          ? "font-semibold text-white"
                          : i < activeFeature
                            ? "text-white/70"
                            : "text-white/40"
                      }`}
                    >
                      {f.title}
                    </span>
                  </button>
                ))}
              </div>

              {/* Text content — crossfade */}
              <div className="relative min-h-[280px] w-full max-w-lg text-center md:text-left">
                {FEATURES.map((f, i) => (
                  <div
                    key={f.icon}
                    className={`absolute inset-0 flex flex-col justify-center transition-all duration-200 ease-out ${
                      i === activeFeature
                        ? "translate-y-0 opacity-100"
                        : i < activeFeature
                          ? "-translate-y-6 opacity-0 pointer-events-none"
                          : "translate-y-6 opacity-0 pointer-events-none"
                    }`}
                  >
                    <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-white/10 text-blue-300 max-md:mx-auto">
                      <span className="material-symbols-outlined text-2xl">
                        {f.icon}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-white sm:text-3xl">
                      {f.title}
                    </h2>
                    <p className="mt-1 text-base text-white/60 sm:text-lg">
                      {f.subtitle}
                    </p>
                    <p className="mt-4 text-sm leading-relaxed text-white/50">
                      {f.desc}
                    </p>
                    <ul className="mt-5 space-y-2 max-md:mx-auto max-md:w-fit">
                      {f.points.map((point) => (
                        <li
                          key={point}
                          className="flex items-center gap-2 text-sm text-white/80"
                        >
                          <span className="material-symbols-outlined text-base text-blue-300">
                            check_circle
                          </span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Mockup — crossfade */}
            <div className="relative flex min-h-[340px] w-full flex-1 items-center justify-center sm:min-h-[400px]">
              {MOCKUPS.map((Mockup, i) => (
                <div
                  key={i}
                  className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ease-out ${
                    i === activeFeature
                      ? "scale-100 opacity-100"
                      : i < activeFeature
                        ? "scale-95 opacity-0 pointer-events-none"
                        : "scale-105 opacity-0 pointer-events-none"
                  }`}
                >
                  <Mockup />
                </div>
              ))}
            </div>
          </div>

          {/* Segmented progress bar */}
          <div className="mx-auto w-full max-w-md px-6 pb-8">
            <div className="flex gap-2">
              {FEATURES.map((f, i) => (
                <div key={f.icon} className="flex flex-1 flex-col gap-2">
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full bg-white transition-all duration-150 ${
                        i <= activeFeature ? "w-full" : "w-0"
                      }`}
                    />
                  </div>
                  <span
                    className={`text-center text-xs transition-colors duration-150 ${
                      i === activeFeature
                        ? "font-semibold text-white"
                        : i < activeFeature
                          ? "text-white/60"
                          : "text-white/30"
                    }`}
                  >
                    {f.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 3: Login ── */}
      <section
        ref={loginSectionRef}
        className="relative flex min-h-screen items-center justify-center px-6"
      >
        <div className="flex w-full max-w-sm flex-col items-center">
          <div className="mb-8 text-center">
            <h2
              className="text-2xl font-bold sm:text-3xl"
              style={{
                color:
                  scrollProgress > 0.7
                    ? `rgba(10,22,40,${0.5 + (scrollProgress - 0.7) * 1.67})`
                    : "rgba(255,255,255,0.95)",
              }}
            >
              지금 시작하세요
            </h2>
            <p
              className="mt-2"
              style={{
                color:
                  scrollProgress > 0.7
                    ? `rgba(30,58,95,${0.4 + (scrollProgress - 0.7) * 1.5})`
                    : "rgba(255,255,255,0.6)",
              }}
            >
              소셜 계정으로 간편하게 시작할 수 있습니다
            </p>
          </div>

          <Card
            className="w-full border-white/20 shadow-2xl backdrop-blur-md"
            style={{
              background:
                scrollProgress > 0.7
                  ? `rgba(255,255,255,${0.7 + (scrollProgress - 0.7) * 1.0})`
                  : "rgba(255,255,255,0.1)",
            }}
          >
            <CardContent className="p-8">
              <div className="flex flex-col gap-3">
                <Button
                  variant="outline"
                  className="h-12 gap-3 border-white/20 bg-white/90 text-sm font-semibold text-gray-800 shadow-sm transition-all hover:bg-white hover:shadow-md"
                  onClick={() => {
                    window.location.href = `${backendUrl}/oauth2/authorization/google`;
                  }}
                >
                  <svg
                    className="size-5"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google로 로그인
                </Button>

                <Button
                  className="h-12 gap-3 border-[#FEE500] bg-[#FEE500] text-sm font-semibold text-[#3C1E1E] shadow-sm transition-all hover:bg-[#FDD800] hover:shadow-md"
                  onClick={() => {
                    window.location.href = `${backendUrl}/oauth2/authorization/kakao`;
                  }}
                >
                  <svg
                    className="size-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.584 1.522 4.857 3.814 6.218L4.7 20.5a.5.5 0 0 0 .746.434l4.686-2.762A11.5 11.5 0 0 0 12 18c5.523 0 10-3.477 10-7.5S17.523 3 12 3z" />
                  </svg>
                  카카오로 로그인
                </Button>
              </div>
            </CardContent>

            <Separator className="bg-white/20" />

            <CardFooter className="justify-center p-4">
              <p
                className="text-center text-xs"
                style={{
                  color:
                    scrollProgress > 0.7
                      ? "rgba(100,116,139,0.8)"
                      : "rgba(255,255,255,0.5)",
                }}
              >
                로그인하면 서비스 이용약관과 개인정보처리방침에 동의하게 됩니다.
              </p>
            </CardFooter>
          </Card>
        </div>
      </section>
    </div>
  );
}
