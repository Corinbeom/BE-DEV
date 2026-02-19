/* eslint-disable @next/next/no-html-link-for-pages */
"use client";

import { useDevMemberId } from "@/features/member/hooks/useDevMemberId";
import { useRecruitmentEntries } from "@/features/application-tracker/hooks/useRecruitmentEntries";

export function DashboardView() {
  const { memberId } = useDevMemberId();
  const { data: entries = [] } = useRecruitmentEntries(memberId);
  const recent = entries.slice(0, 4);
  return (
    <>
      <section className="relative overflow-hidden rounded-xl bg-primary p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="max-w-xl">
            <h3 className="mb-2 text-2xl font-bold">이력서 기반 모의 면접</h3>
            <p className="mb-6 leading-relaxed text-slate-100/80">
              AI가 최신 이력서를 분석했어요. React/Node.js 경험을 기준으로 맞춤형 모의
              면접을 시작할까요?
            </p>
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-bold text-primary shadow-lg transition-colors hover:bg-slate-50"
            >
              <span className="material-symbols-outlined">play_circle</span>
              AI 면접 시작
            </button>
          </div>

          <div className="hidden h-40 w-64 rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur-sm lg:block">
            <div className="mb-4 flex items-center gap-2">
              <div className="size-3 animate-pulse rounded-full bg-green-400" />
              <span className="text-xs font-bold uppercase tracking-wider">
                AI 코치 온라인
              </span>
            </div>
            <div className="space-y-3">
              <div className="h-2 w-full rounded-full bg-white/20" />
              <div className="h-2 w-4/5 rounded-full bg-white/20" />
              <div className="h-2 w-3/4 rounded-full bg-white/20" />
            </div>
          </div>
        </div>

        <div className="absolute right-0 top-0 -mr-20 -mt-20 size-80 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 size-80 rounded-full bg-indigo-400/10 blur-3xl" />
      </section>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold tracking-tight">CS 연습 점수</h3>
            <a className="text-sm font-bold text-primary hover:underline" href="#">
              전체 보기
            </a>
          </div>

          <div className="space-y-4">
            <ScoreItem
              title="운영체제"
              subtitle="상급"
              icon="memory"
              tone="indigo"
              score="85%"
              delta="+5%"
            />
            <ScoreItem
              title="네트워크"
              subtitle="중급"
              icon="hub"
              tone="blue"
              score="72%"
              delta="+2%"
            />
            <ScoreItem
              title="알고리즘"
              subtitle="최상급"
              icon="account_tree"
              tone="purple"
              score="94%"
              delta="+12%"
            />
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold tracking-tight">최근 지원</h3>
            <button
              type="button"
              className="text-slate-500 transition-colors hover:text-primary"
              aria-label="필터"
            >
              <span className="material-symbols-outlined">filter_list</span>
            </button>
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
                  {recent.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-sm text-slate-500"
                      >
                        아직 지원 내역이 없어요.{" "}
                        <a className="font-bold text-primary hover:underline" href="/application-tracker">
                          지원 현황
                        </a>
                        에서 추가해 보세요.
                      </td>
                    </tr>
                  ) : (
                    recent.map((e) => (
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
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/5"
              >
                전체 지원 이력 보기
                <span className="material-symbols-outlined text-sm">
                  arrow_forward
                </span>
              </button>
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

function ScoreItem({
  title,
  subtitle,
  icon,
  tone,
  score,
  delta,
}: {
  title: string;
  subtitle: string;
  icon: string;
  tone: "indigo" | "blue" | "purple";
  score: string;
  delta: string;
}) {
  const toneClass =
    tone === "indigo"
      ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
      : tone === "blue"
        ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
        : "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400";

  return (
    <div className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-white/5 dark:bg-white/5">
      <div className="flex items-center gap-4">
        <div
          className={[
            "flex size-12 items-center justify-center rounded-lg",
            toneClass,
          ].join(" ")}
        >
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <div>
          <p className="text-sm font-bold">{title}</p>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xl font-black text-primary">{score}</p>
        <p className="flex items-center justify-end text-[10px] font-bold text-green-500">
          <span className="material-symbols-outlined text-xs">trending_up</span>{" "}
          {delta}
        </p>
      </div>
    </div>
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


