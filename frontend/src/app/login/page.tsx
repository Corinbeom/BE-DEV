"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { apiBaseUrl } from "@/lib/api";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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

/* ── (mockups removed — clean card grid) ── */

/* ── Main Page ── */

export default function LoginPage() {
  const { user, isLoading, serverStatus, retryConnection } = useAuth();
  const router = useRouter();
  const loginSectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

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

  // Overscroll 시 흰색 배경 방지: html 배경을 페이지 색상에 맞춤
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.backgroundColor;
    html.style.backgroundColor = "#0a1628";
    return () => {
      html.style.backgroundColor = prev;
    };
  }, []);

  /* ── Early-return states ── */

  if (serverStatus === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a1628]">
        <span className="material-symbols-outlined animate-spin text-4xl text-blue-400">
          progress_activity
        </span>
      </div>
    );
  }

  if (serverStatus === "warming") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#0a1628]">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
          <span className="material-symbols-outlined animate-spin text-3xl">
            progress_activity
          </span>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-white">
            서버가 시작되고 있습니다
          </h2>
          <p className="mt-2 text-sm text-white/60">
            첫 접속 시 30~60초 정도 소요될 수 있어요.
          </p>
        </div>
        <div className="h-1.5 w-48 overflow-hidden rounded-full bg-white/10">
          <div className="animate-progress-indeterminate h-full rounded-full bg-blue-500" />
        </div>
      </div>
    );
  }

  if (serverStatus === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#0a1628]">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-600/25">
          <span className="material-symbols-outlined text-3xl">cloud_off</span>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-white">
            서버에 연결할 수 없습니다
          </h2>
          <p className="mt-2 text-sm text-white/60">
            잠시 후 다시 시도해 주세요.
          </p>
        </div>
        <Button
          className="bg-blue-600 text-white hover:bg-blue-700"
          onClick={retryConnection}
        >
          다시 연결
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a1628]">
        <span className="material-symbols-outlined animate-spin text-4xl text-blue-400">
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

  return (
    <div className="relative bg-[#0a1628]">
      {/* ── Stars ── */}
      <div className="pointer-events-none fixed inset-0 z-10">
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
      <div className="pointer-events-none fixed -top-32 -right-32 size-[500px] rounded-full bg-blue-600/8 blur-3xl" />
      <div className="pointer-events-none fixed top-1/2 -left-48 size-[440px] rounded-full bg-blue-600/10 blur-3xl" />

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
          <h1 className="text-3xl font-bold tracking-tight text-white/95 sm:text-4xl">
            Before Your Sunrise
          </h1>
          <p className="mt-3 max-w-lg text-base text-white/70 sm:text-lg">
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

        <span className="material-symbols-outlined absolute bottom-10 animate-bounce text-2xl text-white/40">
          keyboard_arrow_down
        </span>
      </section>

      {/* ── Section 2: Feature Cards ── */}
      <section className="relative px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              취업 준비의 모든 것
            </h2>
            <p className="mt-3 text-sm text-white/50">
              AI 기반 분석부터 체계적 관리까지, 한 곳에서
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.icon}
                className="rounded-2xl border border-white/8 bg-white/[0.04] p-6"
              >
                <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                  <span className="material-symbols-outlined text-xl">
                    {f.icon}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">{f.title}</h3>
                <p className="mt-1 text-sm text-white/45">{f.subtitle}</p>
                <ul className="mt-5 space-y-2">
                  {f.points.map((point) => (
                    <li
                      key={point}
                      className="flex items-start gap-2 text-[13px] leading-relaxed text-white/60"
                    >
                      <span className="material-symbols-outlined mt-0.5 text-sm text-blue-400/70">
                        check
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 3: Login ── */}
      <section
        ref={loginSectionRef}
        className="relative flex min-h-[70vh] items-center justify-center px-6 pb-16"
      >
        <div className="flex w-full max-w-sm flex-col items-center">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-white/95 sm:text-3xl">
              지금 시작하세요
            </h2>
            <p className="mt-2 text-white/60">
              소셜 계정으로 간편하게 시작할 수 있습니다
            </p>
          </div>

          <Card className="w-full border-white/15 bg-white/10 shadow-2xl backdrop-blur-md">
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

            <Separator className="bg-white/10" />

            <CardFooter className="justify-center p-4">
              <p className="text-center text-xs text-white/40">
                로그인하면 서비스 이용약관과 개인정보처리방침에 동의하게 됩니다.
              </p>
            </CardFooter>
          </Card>
        </div>
      </section>
    </div>
  );
}
