"use client";

import Link from "next/link";
import { useRecruitmentEntries } from "@/features/application-tracker/hooks/useRecruitmentEntries";
import { useCsQuizSessions } from "@/features/study-quiz/hooks/useCsQuizSessions";
import { useResumeSessions } from "@/features/resume-analyzer/hooks/useResumeSessions";
import type { CsQuizSession } from "@/features/study-quiz/api/types";
import { LearningInsights } from "./LearningInsights";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DashboardView() {
  const { data: entries = [] } = useRecruitmentEntries();
  const { data: quizSessions = [] } = useCsQuizSessions();
  const { data: resumeSessions = [] } = useResumeSessions();

  const recentEntries = entries.slice(0, 4);
  const recentQuizSessions = quizSessions.slice(0, 3);
  const latestResumeSession = resumeSessions[0] ?? null;

  return (
    <>
      {/* AI Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 p-8 text-primary-foreground shadow-xl shadow-primary/15">
        <div className="relative z-10 flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="max-w-xl">
            <Badge className="mb-3 border-primary-foreground/20 bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/20">
              AI Interview Coach
            </Badge>
            <h3 className="mb-2 text-2xl font-bold">이력서 기반 모의 면접</h3>
            {latestResumeSession ? (
              <p className="mb-6 leading-relaxed text-primary-foreground/80">
                최근 분석:{" "}
                <span className="font-semibold text-primary-foreground">
                  {latestResumeSession.title}
                </span>
                {latestResumeSession.questions.length > 0
                  ? ` · 질문 ${latestResumeSession.questions.length}개 준비됨`
                  : ""}
              </p>
            ) : (
              <p className="mb-6 leading-relaxed text-primary-foreground/80">
                이력서를 업로드하면 AI가 분석해 맞춤 면접 질문을 생성해 드립니다.
              </p>
            )}
            <Link
              href={
                latestResumeSession
                  ? `/resume-analyzer/practice?sessionId=${latestResumeSession.id}`
                  : "/resume-analyzer/practice"
              }
              className={cn(
                buttonVariants(),
                "gap-2 bg-white text-primary shadow-lg hover:bg-white/90"
              )}
            >
              <span className="material-symbols-outlined text-lg">
                play_circle
              </span>
              {latestResumeSession ? "이어서 연습하기" : "분석 시작하기"}
            </Link>
          </div>

          <Card className="hidden border-primary-foreground/20 bg-primary-foreground/10 shadow-none backdrop-blur-sm lg:block">
            <CardContent className="flex h-40 w-64 flex-col justify-between p-4">
              {latestResumeSession ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className="size-2.5 rounded-full bg-green-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-primary-foreground/90">
                      최근 분석 완료
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-primary-foreground/60">세션</p>
                    <p className="truncate text-sm font-semibold text-primary-foreground">
                      {latestResumeSession.title}
                    </p>
                    <p className="text-xs text-primary-foreground/60">
                      {latestResumeSession.positionType ?? "포지션 미지정"} ·{" "}
                      {new Date(
                        latestResumeSession.createdAt
                      ).toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <div className="size-2.5 animate-pulse rounded-full bg-green-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-primary-foreground/90">
                      AI 코치 대기 중
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="h-2 w-full rounded-full bg-primary-foreground/15" />
                    <div className="h-2 w-4/5 rounded-full bg-primary-foreground/15" />
                    <div className="h-2 w-3/4 rounded-full bg-primary-foreground/15" />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 size-80 rounded-full bg-white/8 blur-3xl" />
      </section>

      {/* Stats Strip */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          label="총 지원"
          value={entries.length}
          icon="description"
          color="primary"
        />
        <StatCard
          label="면접 진행"
          value={entries.filter((e) => e.step === "INTERVIEWING").length}
          icon="event"
          color="amber"
        />
        <StatCard
          label="오퍼"
          value={entries.filter((e) => e.step === "OFFERED").length}
          icon="workspace_premium"
          color="emerald"
        />
        <StatCard
          label="퀴즈 세션"
          value={quizSessions.length}
          icon="quiz"
          color="violet"
        />
        <StatCard
          label="면접 세션"
          value={resumeSessions.length}
          icon="psychology"
          color="primary"
        />
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

const colorMap = {
  primary: {
    icon: "text-primary bg-primary/10",
    border: "border-l-primary",
  },
  amber: {
    icon: "text-amber-600 bg-amber-500/10",
    border: "border-l-amber-500",
  },
  emerald: {
    icon: "text-emerald-600 bg-emerald-500/10",
    border: "border-l-emerald-500",
  },
  violet: {
    icon: "text-violet-600 bg-violet-500/10",
    border: "border-l-violet-500",
  },
} as const;

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: string;
  color: keyof typeof colorMap;
}) {
  const c = colorMap[color];
  return (
    <Card className={cn("border-l-4 transition-shadow hover:shadow-md", c.border)}>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{value}</p>
        </div>
        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-lg",
            c.icon
          )}
        >
          <span className="material-symbols-outlined">{icon}</span>
        </div>
      </CardContent>
    </Card>
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
