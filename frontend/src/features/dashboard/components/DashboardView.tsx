"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRecruitmentEntries } from "@/features/application-tracker/hooks/useRecruitmentEntries";
import { useCsQuizSessions } from "@/features/study-quiz/hooks/useCsQuizSessions";
import { useResumeSessions } from "@/features/resume-analyzer/hooks/useResumeSessions";
import type { CsQuizSession } from "@/features/study-quiz/api/types";
import { LearningInsights } from "./LearningInsights";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { cn } from "@/lib/utils";

const LEARNING_RESOURCES = [
  { key: "programmers", name: "프로그래머스", url: "https://school.programmers.co.kr/learn/challenges", icon: "code", color: "text-blue-600 bg-blue-500/10" },
  { key: "baekjoon", name: "백준", url: "https://www.acmicpc.net", icon: "terminal", color: "text-sky-600 bg-sky-500/10" },
  { key: "leetcode", name: "LeetCode", url: "https://leetcode.com/problemset", icon: "data_object", color: "text-amber-600 bg-amber-500/10" },
  { key: "swea", name: "SWEA", url: "https://swexpertacademy.com/main/main.do", icon: "developer_board", color: "text-indigo-600 bg-indigo-500/10" },
  { key: "codeforces", name: "Codeforces", url: "https://codeforces.com", icon: "emoji_events", color: "text-red-600 bg-red-500/10" },
];

export function DashboardView() {
  const { data: entries = [] } = useRecruitmentEntries();
  const { data: quizSessions = [] } = useCsQuizSessions();
  const { data: resumeSessions = [] } = useResumeSessions();

  const recentEntries = entries.slice(0, 4);
  const recentQuizSessions = quizSessions.slice(0, 3);
  const latestResumeSession = resumeSessions[0] ?? null;

  /* ── Hero Carousel ── */
  const heroSlides = useHeroSlides({
    latestResumeSession,
    quizCount: quizSessions.length,
    entryCount: entries.length,
  });

  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!carouselApi) return;
    const onSelect = () => setCurrentSlide(carouselApi.selectedScrollSnap());
    carouselApi.on("select", onSelect);
    onSelect();
    return () => { carouselApi.off("select", onSelect); };
  }, [carouselApi]);

  return (
    <>
      {/* AI Hero Banner — Embla Carousel with drag/swipe + autoplay */}
      <Carousel
        opts={{ loop: true }}
        plugins={[Autoplay({ delay: 8000, stopOnInteraction: false, stopOnMouseEnter: true })]}
        setApi={setCarouselApi}
        className="rounded-2xl shadow-xl shadow-primary/15"
      >
        <CarouselContent className="ml-0">
          {heroSlides.map((slide, i) => (
            <CarouselItem key={i} className="pl-0">
              <section
                className={cn(
                  "relative overflow-hidden rounded-2xl p-8 text-primary-foreground bg-gradient-to-br transition-colors duration-500",
                  slide.gradient,
                )}
              >
                <div className="relative z-10 flex flex-col items-center justify-between gap-6 md:flex-row">
                  <div className="max-w-xl">
                    <Badge className="mb-3 border-primary-foreground/20 bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/20">
                      {slide.badge}
                    </Badge>
                    <h3 className="mb-2 text-2xl font-bold">{slide.title}</h3>
                    <p className="mb-6 leading-relaxed text-primary-foreground/80">
                      {slide.description}
                    </p>
                    <Link
                      href={slide.href}
                      className={cn(
                        buttonVariants(),
                        "gap-2 bg-white text-primary shadow-lg hover:bg-white/90",
                      )}
                    >
                      <span className="material-symbols-outlined text-lg">
                        {slide.buttonIcon}
                      </span>
                      {slide.buttonText}
                    </Link>
                  </div>

                  {/* Right mini card */}
                  <Card className="hidden border-primary-foreground/20 bg-primary-foreground/10 shadow-none backdrop-blur-sm lg:block">
                    <CardContent className="flex h-40 w-64 flex-col justify-between p-4">
                      <div className="flex items-center gap-2">
                        <div className={cn("size-2.5 rounded-full", slide.card.dotColor)} />
                        <span className="text-xs font-bold uppercase tracking-wider text-primary-foreground/90">
                          {slide.card.label}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {slide.card.lines.map((line, li) => (
                          <p
                            key={li}
                            className={cn(
                              "text-xs",
                              li === 1
                                ? "truncate text-sm font-semibold text-primary-foreground"
                                : "text-primary-foreground/60",
                            )}
                          >
                            {line}
                          </p>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Slide indicators */}
                <div className="relative z-10 mt-5 flex justify-center gap-2 md:justify-start">
                  {heroSlides.map((_, di) => (
                    <button
                      key={di}
                      onClick={() => carouselApi?.scrollTo(di)}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        di === currentSlide
                          ? "w-6 bg-white"
                          : "w-1.5 bg-white/40 hover:bg-white/60",
                      )}
                      aria-label={`슬라이드 ${di + 1}`}
                    />
                  ))}
                </div>

                <div className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-white/5 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-20 -left-20 size-80 rounded-full bg-white/8 blur-3xl" />
              </section>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Summary Strip */}
      <section className="flex flex-wrap items-baseline gap-x-8 gap-y-3 px-1">
        <div>
          <span className="text-3xl font-extrabold text-foreground">{entries.length}</span>
          <span className="ml-1.5 text-sm text-muted-foreground">총 지원</span>
        </div>
        {entries.filter((e) => e.step === "INTERVIEWING").length > 0 && (
          <div>
            <span className="text-3xl font-extrabold text-amber-600">{entries.filter((e) => e.step === "INTERVIEWING").length}</span>
            <span className="ml-1.5 text-sm text-muted-foreground">면접 진행</span>
          </div>
        )}
        {entries.filter((e) => e.step === "OFFERED").length > 0 && (
          <div>
            <span className="text-3xl font-extrabold text-emerald-600">{entries.filter((e) => e.step === "OFFERED").length}</span>
            <span className="ml-1.5 text-sm text-muted-foreground">오퍼</span>
          </div>
        )}
        <div>
          <span className="text-3xl font-extrabold text-violet-600">{quizSessions.length}</span>
          <span className="ml-1.5 text-sm text-muted-foreground">퀴즈 세션</span>
        </div>
        <div>
          <span className="text-3xl font-extrabold text-primary">{resumeSessions.length}</span>
          <span className="ml-1.5 text-sm text-muted-foreground">면접 세션</span>
        </div>
      </section>

      {/* Learning Resources */}
      <section>
        <h3 className="mb-4 text-lg font-bold tracking-tight text-foreground">
          학습 리소스
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {LEARNING_RESOURCES.map((res) => (
            <a
              key={res.key}
              href={res.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <Card className="transition-all hover:-translate-y-1 hover:shadow-md hover:border-primary/30">
                <CardContent className="flex flex-col items-center gap-2 p-4">
                  <div className={cn("flex size-10 items-center justify-center rounded-lg", res.color)}>
                    <span className="material-symbols-outlined text-xl">{res.icon}</span>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground transition-colors group-hover:text-foreground">
                    {res.name}
                  </span>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      </section>

      {/* Learning Insights */}
      <LearningInsights
        quizSessions={quizSessions}
        resumeSessions={resumeSessions}
      />

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* CS Quiz Sessions */}
        <div className="space-y-4 lg:col-span-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold tracking-tight text-foreground">
              최근 CS 퀴즈
            </h3>
            <Link
              href="/study-quiz"
              className="text-sm font-semibold text-primary hover:underline"
            >
              전체 보기
            </Link>
          </div>

          <div className="space-y-3">
            {recentQuizSessions.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center gap-3 p-8 text-center">
                  <span className="material-symbols-outlined text-3xl text-muted-foreground">
                    quiz
                  </span>
                  <p className="text-sm text-muted-foreground">
                    아직 CS 퀴즈 기록이 없어요.
                  </p>
                  <Link
                    href="/study-quiz"
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    퀴즈 시작하기
                  </Link>
                </CardContent>
              </Card>
            ) : (
              recentQuizSessions.map((session) => (
                <QuizSessionItem key={session.id} session={session} />
              ))
            )}
          </div>
        </div>

        {/* Recent Applications */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold tracking-tight text-foreground">
              최근 지원
            </h3>
            <Link
              href="/application-tracker"
              className="text-muted-foreground transition-colors hover:text-primary"
              aria-label="전체 보기"
            >
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-3">회사</th>
                    <th className="px-6 py-3">포지션</th>
                    <th className="px-6 py-3">지원일</th>
                    <th className="px-6 py-3">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentEntries.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-8 text-center text-sm text-muted-foreground"
                      >
                        아직 지원 내역이 없어요.{" "}
                        <Link
                          className="font-semibold text-primary hover:underline"
                          href="/application-tracker"
                        >
                          지원 현황
                        </Link>
                        에서 추가해 보세요.
                      </td>
                    </tr>
                  ) : (
                    recentEntries.map((e) => (
                      <RecentRow
                        key={e.id}
                        company={e.companyName}
                        role={e.position}
                        applied={e.appliedDate ?? "-"}
                        status={toKoreanStep(e.step)}
                        statusTone={toneFromStep(e.step)}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-border bg-muted/30 p-3 text-center">
              <Link
                href="/application-tracker"
                className="flex w-full items-center justify-center gap-2 rounded-lg py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
              >
                전체 지원 이력 보기
                <span className="material-symbols-outlined text-sm">
                  arrow_forward
                </span>
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </>
  );
}

function toKoreanStep(step: string) {
  switch (step) {
    case "READY":
      return "준비";
    case "APPLIED":
      return "지원";
    case "DOC_PASSED":
      return "서류 합격";
    case "TEST_PHASE":
      return "테스트";
    case "INTERVIEWING":
      return "면접";
    case "OFFERED":
      return "오퍼";
    case "REJECTED":
      return "불합격";
    case "ON_HOLD":
      return "보류";
    default:
      return step;
  }
}

function toneFromStep(step: string) {
  switch (step) {
    case "OFFERED":
      return "success" as const;
    case "INTERVIEWING":
      return "warn" as const;
    case "REJECTED":
      return "danger" as const;
    default:
      return "neutral" as const;
  }
}

function topicLabel(topic: string) {
  const map: Record<string, string> = {
    OS: "운영체제",
    NETWORK: "네트워크",
    DB: "데이터베이스",
    SPRING: "Spring",
    JAVA: "Java",
    DATA_STRUCTURE: "자료구조",
    ALGORITHM: "알고리즘",
    ARCHITECTURE: "아키텍처",
    CLOUD: "클라우드",
  };
  return map[topic] ?? topic;
}

function statusKorean(status: string) {
  switch (status) {
    case "QUESTIONS_READY":
      return "완료";
    case "CREATED":
      return "생성 중";
    case "FAILED":
      return "실패";
    default:
      return status;
  }
}

function statusVariant(status: string) {
  switch (status) {
    case "QUESTIONS_READY":
      return "default" as const;
    case "CREATED":
      return "secondary" as const;
    case "FAILED":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}

function QuizSessionItem({ session }: { session: CsQuizSession }) {
  const topics = Array.isArray(session.topics) ? session.topics : [];
  const topicDisplay = topics.slice(0, 2).map(topicLabel).join(", ");
  const extraCount = topics.length - 2;

  return (
    <Link href={`/study-quiz/practice?sessionId=${session.id}`}>
      <Card className="group transition-all hover:shadow-md hover:border-primary/30">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <span className="material-symbols-outlined">quiz</span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                {session.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {topicDisplay}
                {extraCount > 0 ? ` +${extraCount}` : ""}
              </p>
            </div>
          </div>
          <div className="ml-3 shrink-0 text-right">
            <Badge variant={statusVariant(session.status)}>
              {statusKorean(session.status)}
            </Badge>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {new Date(session.createdAt).toLocaleDateString("ko-KR")}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

/* ── Hero slide data ── */
interface HeroSlide {
  badge: string;
  title: string;
  description: string;
  buttonText: string;
  buttonIcon: string;
  href: string;
  gradient: string;
  card: {
    dotColor: string;
    label: string;
    lines: string[];
  };
}

function useHeroSlides({
  latestResumeSession,
  quizCount,
  entryCount,
}: {
  latestResumeSession: import("@/features/resume-analyzer/api/types").ResumeSession | null;
  quizCount: number;
  entryCount: number;
}): HeroSlide[] {
  return [
    {
      badge: "AI Interview Coach",
      title: "이력서 기반 모의 면접",
      gradient: "from-primary via-primary to-primary/80",
      description: latestResumeSession
        ? `최근 분석: ${latestResumeSession.title}${latestResumeSession.questions.length > 0 ? ` · 질문 ${latestResumeSession.questions.length}개 준비됨` : ""}`
        : "이력서를 업로드하면 AI가 분석해 맞춤 면접 질문을 생성해 드립니다.",
      buttonText: latestResumeSession ? "이어서 연습하기" : "분석 시작하기",
      buttonIcon: "play_circle",
      href: latestResumeSession
        ? `/resume-analyzer/practice?sessionId=${latestResumeSession.id}`
        : "/resume-analyzer/practice",
      card: latestResumeSession
        ? {
            dotColor: "bg-green-400",
            label: "최근 분석 완료",
            lines: [
              "세션",
              latestResumeSession.title,
              `${latestResumeSession.positionType ?? "포지션 미지정"} · ${new Date(latestResumeSession.createdAt).toLocaleDateString("ko-KR")}`,
            ],
          }
        : {
            dotColor: "bg-green-400 animate-pulse",
            label: "AI 코치 대기 중",
            lines: ["이력서를 업로드하고", "맞춤 면접 질문을", "받아보세요"],
          },
    },
    {
      badge: "CS Quiz",
      title: "CS 기술 면접 준비",
      gradient: "from-violet-700 via-violet-700 to-violet-600/80",
      description:
        quizCount > 0
          ? `지금까지 ${quizCount}개 퀴즈 세션을 진행했어요. 더 풀어볼까요?`
          : "9가지 토픽의 CS 문제로 기술 면접 실력을 키워보세요.",
      buttonText: "퀴즈 풀기",
      buttonIcon: "code",
      href: "/study-quiz",
      card: {
        dotColor: "bg-violet-400",
        label: "CS 퀴즈",
        lines: [
          "진행 세션",
          `${quizCount}개`,
          "OS · 네트워크 · DB · Spring 외 5개",
        ],
      },
    },
    {
      badge: "Tracker",
      title: "지원 현황 관리",
      gradient: "from-emerald-600 via-emerald-600 to-emerald-500/80",
      description:
        entryCount > 0
          ? `현재 ${entryCount}개 지원을 관리 중이에요. 새 지원을 추가해 보세요.`
          : "칸반 보드로 전형 단계를 한눈에 관리하세요.",
      buttonText: "지원 현황 보기",
      buttonIcon: "work",
      href: "/application-tracker",
      card: {
        dotColor: "bg-amber-400",
        label: "지원 현황",
        lines: [
          "총 지원",
          `${entryCount}건`,
          "준비 · 지원 · 면접 · 오퍼",
        ],
      },
    },
  ];
}

function RecentRow({
  company,
  role,
  applied,
  status,
  statusTone,
}: {
  company: string;
  role: string;
  applied: string;
  status: string;
  statusTone: "success" | "warn" | "neutral" | "danger";
}) {
  const toneClasses =
    statusTone === "success"
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
      : statusTone === "warn"
        ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
        : statusTone === "danger"
          ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
          : "bg-muted text-muted-foreground";

  return (
    <tr className="group transition-colors hover:bg-muted/50">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-md bg-foreground text-[10px] font-bold text-background">
            {company.slice(0, 1).toUpperCase()}
          </div>
          <span className="text-sm font-semibold text-foreground">{company}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-foreground">{role}</td>
      <td className="px-6 py-4 text-sm text-muted-foreground">{applied}</td>
      <td className="px-6 py-4">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
            toneClasses
          )}
        >
          {status}
        </span>
      </td>
    </tr>
  );
}
