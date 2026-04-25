"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { apiBaseUrl } from "@/lib/api";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/* ── Star Data ── */
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

/* ── Mockup Components ── */

function InterviewMockup() {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="size-1.5 rounded-full bg-blue-400" />
        <span className="text-[11px] text-white/40">백엔드 이력서 v3 · 진행률 60% · 3문항</span>
      </div>
      <div className="mb-3 rounded-xl border border-white/8 bg-white/[0.03] p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-md bg-blue-500/20 px-2 py-0.5 text-[10px] font-semibold text-blue-300">기술 심화</span>
          <span className="text-[10px] text-white/30">질문 3</span>
        </div>
        <p className="text-sm leading-relaxed text-white/80">
          N+1 문제가 무엇인지 설명하고, 해결 방법을 말씀해주세요.
        </p>
      </div>
      <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
        <p className="mb-2 text-[10px] text-white/40">내 답변</p>
        <p className="text-xs leading-relaxed text-white/70">
          하나의 엔티티를 조회할 때 연관된 엔티티를 개별 쿼리로 로딩하는 현상입니다. Fetch Join으로 해결할 수 있습니다.
        </p>
        <div className="mt-3 border-t border-white/8 pt-3">
          <div className="flex items-start gap-1.5">
            <span className="material-symbols-outlined mt-0.5 text-sm text-green-400">check_circle</span>
            <p className="text-[11px] text-green-400/80">개념과 해결방법을 정확하게 설명했습니다.</p>
          </div>
          <div className="mt-1.5 flex items-start gap-1.5">
            <span className="material-symbols-outlined mt-0.5 text-sm text-amber-400">lightbulb</span>
            <p className="text-[11px] text-amber-400/80">지연로딩 전략도 언급하면 더 완성도 높은 답변이 됩니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MatchingMockup() {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[11px] text-white/40">네이버 · 서버 개발자 (신입)</span>
        <span className="rounded-md bg-blue-500/20 px-2 py-0.5 text-[10px] font-semibold text-blue-300">매칭 분석 결과</span>
      </div>
      <div className="mb-3 flex items-center gap-4 rounded-xl border border-white/8 bg-white/[0.03] p-4">
        <div className="flex flex-col items-center">
          <span className="text-4xl font-black text-[oklch(0.62_0.18_150)]">72</span>
          <span className="text-[10px] text-white/40">%</span>
        </div>
        <div className="flex-1">
          <p className="mb-1.5 text-xs font-semibold text-white/70">매칭률</p>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[72%] rounded-full bg-[oklch(0.62_0.18_150)]" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
          <p className="mb-2 text-[10px] text-white/40">핵심 역량 매칭</p>
          <div className="flex flex-wrap gap-1">
            {["Spring Boot", "JPA", "MySQL"].map((k) => (
              <span key={k} className="rounded bg-green-500/15 px-1.5 py-0.5 text-[10px] font-medium text-green-400">{k}</span>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
          <p className="mb-2 text-[10px] text-white/40">보완 필요</p>
          <div className="flex flex-wrap gap-1">
            {["Kubernetes", "Redis"].map((k) => (
              <span key={k} className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">{k}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportMockup() {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-semibold text-white/60">세션 리포트</p>
        <span className="text-[11px] text-white/30">5개 질문 완료 · 2026.04.20</span>
      </div>
      <div className="mb-3 flex items-center gap-4 rounded-xl border border-white/8 bg-white/[0.03] p-4">
        <div className="flex flex-col items-center">
          <span className="text-4xl font-black text-blue-400">7.8</span>
          <span className="text-[10px] text-white/40">종합 점수</span>
        </div>
        <div className="flex-1 space-y-1.5">
          {[
            { label: "기술 심화", pct: 85 },
            { label: "프로젝트", pct: 70 },
            { label: "협업/행동", pct: 60 },
          ].map((item) => (
            <div key={item.label}>
              <div className="mb-0.5 flex justify-between">
                <span className="text-[10px] text-white/40">{item.label}</span>
                <span className="text-[10px] text-white/40">{item.pct}%</span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-blue-500" style={{ width: `${item.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
        <p className="mb-2 text-[10px] text-white/40">개선 포인트</p>
        <div className="space-y-1.5">
          {["분산 락 개념 보완", "시스템 설계 답변 구조화"].map((item) => (
            <div key={item} className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-xs text-amber-400">arrow_forward</span>
              <p className="text-[11px] text-white/60">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuizMockup() {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-1.5">
          {["OS", "NETWORK", "DB"].map((t) => (
            <span key={t} className="rounded-md bg-blue-500/20 px-2 py-0.5 text-[10px] font-semibold text-blue-300">{t}</span>
          ))}
        </div>
        <span className="rounded-md bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-300">HIGH</span>
      </div>
      <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
        <p className="mb-4 text-sm leading-relaxed text-white/80">
          TCP와 UDP의 차이점으로 올바른 것은?
        </p>
        <div className="flex flex-col gap-2">
          {[
            { label: "A. TCP는 비연결형 프로토콜이다", state: "wrong" },
            { label: "B. TCP는 신뢰성 있는 데이터 전송을 보장한다", state: "correct" },
            { label: "C. UDP는 흐름 제어를 지원한다", state: "normal" },
            { label: "D. 둘 다 순서 보장을 제공한다", state: "normal" },
          ].map((opt, i) => (
            <div
              key={i}
              className={cn(
                "rounded-lg border px-3 py-2 text-[11px] leading-snug",
                opt.state === "correct" && "border-green-500/40 bg-green-500/10 text-green-300",
                opt.state === "wrong" && "border-red-500/30 bg-red-500/5 text-white/40 line-through",
                opt.state === "normal" && "border-white/8 bg-white/[0.02] text-white/50",
              )}
            >
              {opt.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TrackerMockup() {
  const columns = [
    { label: "준비", dot: "bg-white/30", items: ["토스 · 백엔드"] },
    { label: "지원", dot: "bg-blue-400", items: ["카카오 · iOS", "네이버 · FE"] },
    { label: "면접", dot: "bg-purple-400", items: ["당근 · 서버"] },
    { label: "합격", dot: "bg-green-400", items: [] },
  ];
  return (
    <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <p className="mb-4 text-xs font-semibold text-white/50">지원 현황 트래커</p>
      <div className="grid grid-cols-4 gap-2">
        {columns.map((col) => (
          <div key={col.label}>
            <div className="mb-2 flex items-center gap-1">
              <div className={cn("size-1.5 rounded-full", col.dot)} />
              <span className="text-[10px] text-white/40">{col.label}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {col.items.map((item) => (
                <div key={item} className="rounded-lg border border-white/8 bg-white/[0.05] p-2">
                  <p className="text-[10px] leading-tight text-white/70">{item}</p>
                </div>
              ))}
              {col.items.length === 0 && (
                <div className="h-10 rounded-lg border border-dashed border-white/8" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Feature Section Data ── */
const FEATURES = [
  {
    id: "interview",
    label: "면접 준비",
    headline: ["내 이력서로", "맞춤 면접을 연습하세요"],
    desc: "포트폴리오를 업로드하면 AI가 포지션별 맞춤 질문을 생성합니다. 답변하면 즉시 피드백을 받아보세요.",
    points: [
      {
        icon: "psychology",
        title: "포지션별 맞춤 질문 생성",
        desc: "백엔드, 프론트엔드 등 9개 포지션에 특화된 프롬프트로 실전 질문을 생성합니다.",
      },
      {
        icon: "rate_review",
        title: "실시간 AI 피드백",
        desc: "강점, 개선점, 모범 답변, 후속 질문까지 실제 면접관 수준의 피드백을 즉시 받아보세요.",
      },
      {
        icon: "summarize",
        title: "세션 완료 후 종합 리포트",
        desc: "역량 갭 분석, 토픽별 점수, 개선 포인트를 한눈에 확인할 수 있는 리포트를 제공합니다.",
      },
    ],
    Mockup: InterviewMockup,
    reverse: false,
  },
  {
    id: "matching",
    label: "매칭 분석",
    headline: ["내 이력서가", "이 공고에 얼마나 맞을까요?"],
    desc: "채용 공고 텍스트를 붙여넣으면 AI가 이력서와 비교 분석해 매칭률과 개선 포인트를 제시합니다.",
    points: [
      {
        icon: "manage_search",
        title: "키워드 매칭 분석",
        desc: "JD의 핵심 기술 스택, 역량, 경험 요건과 이력서를 비교해 충족·부족 항목을 시각화합니다.",
      },
      {
        icon: "tips_and_updates",
        title: "개선 포인트 제안",
        desc: "부족한 부분을 어떻게 보완할지, 어떤 경험을 강조해야 할지 구체적인 가이드를 제공합니다.",
      },
      {
        icon: "link",
        title: "면접 질문 연계",
        desc: "분석 결과를 바탕으로 해당 공고에 특화된 면접 질문 세션을 바로 시작할 수 있습니다.",
      },
    ],
    Mockup: MatchingMockup,
    reverse: true,
  },
  {
    id: "report",
    label: "면접 리포트",
    headline: ["세션이 끝나면", "종합 리포트가 생성됩니다"],
    desc: "답변한 모든 질문의 피드백을 분석해 역량 갭, 강점, 개선 포인트를 한눈에 볼 수 있는 리포트를 제공합니다.",
    points: [
      {
        icon: "analytics",
        title: "역량 갭 분석",
        desc: "토픽별 답변 완성도를 시각화하고, 가장 보완이 필요한 영역을 명확히 짚어줍니다.",
      },
      {
        icon: "star",
        title: "강점 하이라이트",
        desc: "잘 답변한 질문과 키워드를 추출해 실제 면접에서 강조해야 할 포인트를 정리합니다.",
      },
      {
        icon: "school",
        title: "다음 세션 학습 플랜",
        desc: "취약 영역을 기반으로 다음에 집중해야 할 CS 퀴즈 토픽과 면접 질문을 추천합니다.",
      },
    ],
    Mockup: ReportMockup,
    reverse: false,
  },
  {
    id: "quiz",
    label: "CS 퀴즈",
    headline: ["9개 토픽, 3단계 난이도로", "실력을 쌓으세요"],
    desc: "네트워크, DB, 자료구조, 알고리즘, Spring, Java, 아키텍처, 클라우드. 객관식 + 주관식 문제로 깊이 있게 학습하세요.",
    points: [
      {
        icon: "tune",
        title: "다중 토픽 · 난이도 선택",
        desc: "여러 토픽을 동시에 선택하고, 난이도와 문제 수를 자유롭게 설정해 세션을 구성하세요.",
      },
      {
        icon: "grading",
        title: "주관식 AI 채점",
        desc: "핵심 키워드 기반으로 주관식 답변을 AI가 채점하고, 상세한 해설과 개선 방향을 제시합니다.",
      },
      {
        icon: "radar",
        title: "토픽별 정답률 통계",
        desc: "토픽별 실력을 시각화하고 취약 영역을 파악해 집중적으로 학습하세요.",
      },
    ],
    Mockup: QuizMockup,
    reverse: true,
  },
  {
    id: "tracker",
    label: "지원 현황",
    headline: ["지원한 모든 회사를", "한눈에 관리하세요"],
    desc: "서류 준비부터 최종 합격까지. 칸반 보드로 전형 단계를 시각화하고, 메모와 일정을 놓치지 마세요.",
    points: [
      {
        icon: "view_kanban",
        title: "칸반 보드 단계 관리",
        desc: "서류 합격부터 최종 합격까지 드래그로 단계를 이동하세요.",
      },
      {
        icon: "edit_note",
        title: "기업별 메모 · 일정",
        desc: "각 지원 항목에 면접 날짜, 준비 메모, 제출 서류 등을 기록해 체계적으로 관리하세요.",
      },
      {
        icon: "dashboard",
        title: "대시보드 통계 연동",
        desc: "지원 현황이 대시보드에 실시간으로 반영되어 전체 취준 흐름을 한눈에 파악할 수 있습니다.",
      },
    ],
    Mockup: TrackerMockup,
    reverse: false,
  },
];

/* ── Main Page ── */

export default function LoginPage() {
  const { user, isLoading, serverStatus, retryConnection } = useAuth();
  const router = useRouter();
  const loginSectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

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
    if (!isLoading && user) router.replace("/dashboard");
  }, [user, isLoading, router]);

  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.backgroundColor;
    html.style.backgroundColor = "#0a1628";
    return () => { html.style.backgroundColor = prev; };
  }, []);

  if (serverStatus === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a1628]">
        <span className="material-symbols-outlined animate-spin text-4xl text-blue-400">progress_activity</span>
      </div>
    );
  }

  if (serverStatus === "warming") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#0a1628]">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
          <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-white">서버가 시작되고 있습니다</h2>
          <p className="mt-2 text-sm text-white/60">첫 접속 시 30~60초 정도 소요될 수 있어요.</p>
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
          <h2 className="text-xl font-bold text-white">서버에 연결할 수 없습니다</h2>
          <p className="mt-2 text-sm text-white/60">잠시 후 다시 시도해 주세요.</p>
        </div>
        <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={retryConnection}>
          다시 연결
        </Button>
      </div>
    );
  }

  if (isLoading || user) return null;

  const backendUrl = apiBaseUrl();

  return (
    <div className="relative bg-[#0a1628]">
      {/* Stars */}
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

      {/* Mouse-following grid */}
      <div
        ref={gridRef}
        className="pointer-events-none fixed inset-0 opacity-40"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
          mask: "radial-gradient(circle 280px at var(--mx, -200px) var(--my, -200px), black 0%, transparent 100%)",
          WebkitMask: "radial-gradient(circle 280px at var(--mx, -200px) var(--my, -200px), black 0%, transparent 100%)",
        }}
      />

      {/* Gradient blobs */}
      <div className="pointer-events-none fixed -right-32 -top-32 size-[500px] rounded-full bg-blue-600/8 blur-3xl" />
      <div className="pointer-events-none fixed -left-48 top-1/2 size-[440px] rounded-full bg-blue-600/10 blur-3xl" />

      {/* ── Nav ── */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#0a1628]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Image
            src="/logos/bluehour-wordmark-white.png"
            alt="Bluehour"
            width={140}
            height={35}
            priority
          />
          <button
            onClick={() => loginSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="rounded-lg border border-white/15 bg-white/8 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur-sm transition-colors hover:bg-white/15"
          >
            시작하기
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-20">
        <div className="flex flex-col items-center text-center animate-in fade-in duration-700">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">
            <span className="size-1.5 animate-pulse rounded-full bg-blue-400" />
            AI 기반 취업 준비 플랫폼 · 베타 오픈
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-white/95 sm:text-5xl lg:text-6xl">
            당신의 아침이<br />시작되는 곳
          </h1>
          <p className="mt-5 max-w-xl text-base text-white/55 sm:text-lg">
            이력서 분석부터 AI 면접 연습, JD 매칭률 분석, CS 퀴즈까지.
            <br className="hidden sm:block" />
            취업 준비의 모든 단계를 하나의 흐름으로.
          </p>
          <div className="mt-10 flex items-center gap-3">
            <button
              onClick={() => loginSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-500"
            >
              무료로 시작하기
            </button>
            <button
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
              className="rounded-xl border border-white/15 bg-white/8 px-6 py-3 text-sm font-medium text-white/70 backdrop-blur-sm transition-colors hover:bg-white/15"
            >
              기능 살펴보기
            </button>
          </div>
        </div>
        <span className="material-symbols-outlined absolute bottom-10 animate-bounce text-2xl text-white/30">
          keyboard_arrow_down
        </span>
      </section>

      {/* ── Feature Sections ── */}
      <div id="features">
        {FEATURES.map((feat) => {
          const { Mockup } = feat;
          return (
            <section
              key={feat.id}
              id={feat.id}
              className="relative px-6 py-24 lg:py-32"
            >
              {/* Section divider */}
              <div className="mx-auto mb-16 max-w-6xl">
                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/8 to-transparent" />
              </div>

              <div className="mx-auto max-w-6xl">
                <div
                  className={cn(
                    "flex flex-col items-center gap-12 lg:flex-row lg:items-center",
                    feat.reverse && "lg:flex-row-reverse",
                  )}
                >
                  {/* Text side */}
                  <div className="flex flex-1 flex-col">
                    <span className="mb-4 text-xs font-semibold uppercase tracking-widest text-blue-400/70">
                      {feat.label} —
                    </span>
                    <h2 className="text-3xl font-bold leading-tight text-white sm:text-4xl">
                      {feat.headline[0]}
                      <br />
                      {feat.headline[1]}
                    </h2>
                    <p className="mt-5 max-w-md text-sm leading-relaxed text-white/50">
                      {feat.desc}
                    </p>
                    <ul className="mt-8 flex flex-col gap-5">
                      {feat.points.map((pt) => (
                        <li key={pt.title} className="flex items-start gap-3">
                          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                            <span className="material-symbols-outlined text-[16px] text-blue-400">{pt.icon}</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white/85">{pt.title}</p>
                            <p className="mt-0.5 text-[13px] leading-relaxed text-white/45">{pt.desc}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Mockup side */}
                  <div className="flex flex-1 justify-center">
                    <div className="w-full max-w-sm">
                      <Mockup />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* ── Footer CTA + Login ── */}
      <section
        ref={loginSectionRef}
        className="relative px-6 pb-20 pt-16"
      >
        <div className="mx-auto mb-16 max-w-6xl">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/8 to-transparent" />
        </div>

        <div className="mx-auto max-w-lg text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            지금 시작하세요
          </h2>
          <p className="mt-3 text-sm text-white/50">
            당신의 다음 아침은 블루아워와 함께
          </p>

          <Card className="mt-10 border-white/15 bg-white/10 shadow-2xl backdrop-blur-md">
            <CardContent className="p-8">
              <div className="flex flex-col gap-3">
                <Button
                  variant="outline"
                  className="h-12 gap-3 border-white/20 bg-white/90 text-sm font-semibold text-gray-800 shadow-sm transition-all hover:bg-white hover:shadow-md"
                  onClick={() => { window.location.href = `${backendUrl}/oauth2/authorization/google`; }}
                >
                  <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Google로 로그인
                </Button>
                <Button
                  className="h-12 gap-3 border-[#FEE500] bg-[#FEE500] text-sm font-semibold text-[#3C1E1E] shadow-sm transition-all hover:bg-[#FDD800] hover:shadow-md"
                  onClick={() => { window.location.href = `${backendUrl}/oauth2/authorization/kakao`; }}
                >
                  <svg className="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
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

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Image
            src="/logos/bluehour-wordmark-white.png"
            alt="Bluehour"
            width={100}
            height={25}
            className="opacity-40"
          />
          <div className="flex gap-6 text-xs text-white/25">
            <span>서비스 소개</span>
            <span>개인정보처리방침</span>
            <span>이용약관</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
