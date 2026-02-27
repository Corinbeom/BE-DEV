"use client";

import Link from "next/link";
import { useRecruitmentEntries } from "@/features/application-tracker/hooks/useRecruitmentEntries";
import { useCsQuizSessions } from "@/features/study-quiz/hooks/useCsQuizSessions";
import { useResumeSessions } from "@/features/resume-analyzer/hooks/useResumeSessions";
import type { CsQuizSession } from "@/features/study-quiz/api/types";

export function DashboardView() {
  const { data: entries = [] } = useRecruitmentEntries();
  const { data: quizSessions = [] } = useCsQuizSessions();
  const { data: resumeSessions = [] } = useResumeSessions();

  const recentEntries = entries.slice(0, 4);
  const recentQuizSessions = quizSessions.slice(0, 3);
  const latestResumeSession = resumeSessions[0] ?? null;

  return (
    <>
      {/* 이력서 분석 배너 */}
      <section className="relative overflow-hidden rounded-xl bg-primary p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="max-w-xl">
            <h3 className="mb-2 text-2xl font-bold">이력서 기반 모의 면접</h3>
            {latestResumeSession ? (
              <p className="mb-6 leading-relaxed text-slate-100/80">
                최근 분석: <span className="font-semibold">{latestResumeSession.title}</span>
                {latestResumeSession.questions.length > 0
                  ? ` · 질문 ${latestResumeSession.questions.length}개 준비됨`
                  : ""}
              </p>
            ) : (
              <p className="mb-6 leading-relaxed text-slate-100/80">
                이력서를 업로드하면 AI가 분석해 맞춤 면접 질문을 생성해 드립니다.
              </p>
            )}
            <Link
              href="/resume-analyzer"
              className="flex w-fit items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-bold text-primary shadow-lg transition-colors hover:bg-slate-50"
            >
              <span className="material-symbols-outlined">play_circle</span>
              {latestResumeSession ? "이어서 연습하기" : "분석 시작하기"}
            </Link>
          </div>

          <div className="hidden h-40 w-64 rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur-sm lg:block">
            {latestResumeSession ? (
              <div className="h-full flex flex-col justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full bg-green-400" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    최근 분석 완료
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-200/70">세션</p>
                  <p className="text-sm font-semibold truncate">{latestResumeSession.title}</p>
                  <p className="text-xs text-slate-200/70">
                    {latestResumeSession.positionType ?? "포지션 미지정"} ·{" "}
                    {new Date(latestResumeSession.createdAt).toLocaleDateString("ko-KR")}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col justify-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="size-3 animate-pulse rounded-full bg-green-400" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    AI 코치 대기 중
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="h-2 w-full rounded-full bg-white/20" />
                  <div className="h-2 w-4/5 rounded-full bg-white/20" />
                  <div className="h-2 w-3/4 rounded-full bg-white/20" />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="absolute right-0 top-0 -mr-20 -mt-20 size-80 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 size-80 rounded-full bg-indigo-400/10 blur-3xl" />
      </section>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* CS 퀴즈 세션 섹션 */}
        <div className="space-y-6 lg:col-span-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold tracking-tight">최근 CS 퀴즈</h3>
            <Link
              href="/study-quiz/practice"
              className="text-sm font-bold text-primary hover:underline"
            >
              새 퀴즈
            </Link>
          </div>

          <div className="space-y-4">
            {recentQuizSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-white/10 dark:bg-white/5">
                <span className="material-symbols-outlined text-3xl text-slate-400">quiz</span>
                <p className="text-sm text-slate-500">
                  아직 CS 퀴즈 기록이 없어요.
                </p>
                <Link
                  href="/study-quiz/practice"
                  className="text-sm font-bold text-primary hover:underline"
                >
                  퀴즈 시작하기
                </Link>
              </div>
            ) : (
              recentQuizSessions.map((session) => (
                <QuizSessionItem key={session.id} session={session} />
              ))
            )}
          </div>
        </div>

        {/* 최근 지원 현황 */}
        <div className="space-y-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold tracking-tight">최근 지원</h3>
            <Link
              href="/application-tracker"
              className="text-slate-500 transition-colors hover:text-primary"
              aria-label="전체 보기"
            >
              <span className="material-symbols-outlined">filter_list</span>
            </Link>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/5 dark:bg-white/5">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:bg-white/5">
                    <th className="px-6 py-4">회사</th>
                    <th className="px-6 py-4">포지션</th>
                    <th className="px-6 py-4">지원일</th>
                    <th className="px-6 py-4">상태</th>
                    <th className="px-6 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {recentEntries.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-sm text-slate-500"
                      >
                        아직 지원 내역이 없어요.{" "}
                        <Link
                          className="font-bold text-primary hover:underline"
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
                        logo={e.companyName.slice(0, 1).toUpperCase()}
                        logoBg="bg-slate-900"
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

            <div className="bg-slate-50 p-4 text-center dark:bg-white/5">
              <Link
                href="/application-tracker"
                className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/5"
              >
                전체 지원 이력 보기
                <span className="material-symbols-outlined text-sm">
                  arrow_forward
                </span>
              </Link>
            </div>
          </div>
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

function statusTone(status: string) {
  switch (status) {
    case "QUESTIONS_READY":
      return "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400";
    case "CREATED":
      return "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400";
    case "FAILED":
      return "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400";
    default:
      return "bg-slate-50 text-slate-600 dark:bg-white/10 dark:text-slate-400";
  }
}

function QuizSessionItem({ session }: { session: CsQuizSession }) {
  const topics = Array.isArray(session.topics) ? session.topics : [];
  const topicDisplay = topics.slice(0, 2).map(topicLabel).join(", ");
  const extraCount = topics.length - 2;

  return (
    <Link
      href="/study-quiz/practice"
      className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-white/5 dark:bg-white/5"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
          <span className="material-symbols-outlined">quiz</span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{session.title}</p>
          <p className="text-xs text-slate-500">
            {topicDisplay}
            {extraCount > 0 ? ` +${extraCount}` : ""}
          </p>
        </div>
      </div>
      <div className="ml-3 shrink-0 text-right">
        <span
          className={[
            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold",
            statusTone(session.status),
          ].join(" ")}
        >
          {statusKorean(session.status)}
        </span>
        <p className="mt-1 text-[10px] text-slate-400">
          {new Date(session.createdAt).toLocaleDateString("ko-KR")}
        </p>
      </div>
    </Link>
  );
}

function RecentRow({
  logo,
  logoBg,
  company,
  role,
  applied,
  status,
  statusTone,
}: {
  logo: string;
  logoBg: string;
  company: string;
  role: string;
  applied: string;
  status: string;
  statusTone: "success" | "warn" | "neutral" | "danger";
}) {
  const tone =
    statusTone === "success"
      ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
      : statusTone === "warn"
        ? "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400"
        : statusTone === "danger"
          ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
          : "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-400";

  return (
    <tr className="group transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div
            className={[
              "flex size-8 items-center justify-center rounded text-[10px] font-bold text-white",
              logoBg,
            ].join(" ")}
          >
            {logo}
          </div>
          <span className="text-sm font-bold">{company}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-sm font-medium">{role}</td>
      <td className="px-6 py-4 text-sm text-slate-500">{applied}</td>
      <td className="px-6 py-4">
        <span className={["inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold", tone].join(" ")}>
          {status}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <button
          type="button"
          className="material-symbols-outlined text-slate-400 transition-colors hover:text-primary"
          aria-label="더보기"
        >
          more_vert
        </button>
      </td>
    </tr>
  );
}
