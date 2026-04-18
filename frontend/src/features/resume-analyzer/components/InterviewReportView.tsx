"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useResumeInterviewStats } from "../hooks/useResumeInterviewStats";
import { useCoachingReport } from "../hooks/useCoachingReport";
import { useGenerateCoachingReport } from "../hooks/useResumeMutations";
import { InterviewReportSection } from "./InterviewReportSection";
import type { CoachingReport } from "../api/types";

function getCooldownRemainingMs(generatedAt?: string): number {
  if (!generatedAt) return 0;
  const cooldownEnd = new Date(generatedAt).getTime() + 24 * 60 * 60 * 1000;
  return Math.max(0, cooldownEnd - Date.now());
}

function formatRemainingTime(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}시간 ${minutes}분 후 재분석 가능`;
  return `${minutes}분 후 재분석 가능`;
}

export function InterviewReportView() {
  const { data: stats, isLoading } = useResumeInterviewStats();
  const { data: cachedReport, isLoading: isLoadingCoaching } = useCoachingReport();
  const coaching = useGenerateCoachingReport();

  const coachingReport = coaching.data ?? cachedReport ?? null;
  const cooldownMs = getCooldownRemainingMs(coachingReport?.generatedAt);
  const isInCooldown = cooldownMs > 0;

  const hasData =
    stats && stats.badgeStats.length > 0 && stats.attemptedQuestions > 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="size-8">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            면접 연습 리포트
          </h1>
          <p className="text-sm text-muted-foreground">
            면접 질문 연습 결과를 종합적으로 분석합니다
          </p>
        </div>
      </div>

      {/* Content */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {!isLoading && !hasData && (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <span className="material-symbols-outlined text-4xl text-muted-foreground">
            analytics
          </span>
          <p className="text-sm text-muted-foreground">
            아직 면접 연습 데이터가 없습니다.
          </p>
          <Link href="/resume-analyzer">
            <Button variant="outline" size="sm">
              면접 연습 시작하기
            </Button>
          </Link>
        </div>
      )}

      {!isLoading && hasData && stats && (
        <>
          <InterviewReportSection stats={stats} />

          {/* AI Coaching Section */}
          {!isLoadingCoaching && (
            <Card className="border-primary/20">
              <CardContent className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-primary">
                      psychology
                    </span>
                    <h4 className="text-sm font-semibold text-foreground">
                      AI 누적 코칭 분석
                    </h4>
                  </div>
                  {coachingReport && !coaching.isPending && (
                    <div className="flex flex-col items-end gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => coaching.mutate()}
                        disabled={coaching.isPending || isInCooldown}
                      >
                        <span className="material-symbols-outlined mr-1 text-sm">
                          refresh
                        </span>
                        최신 데이터로 재분석
                      </Button>
                      {isInCooldown && (
                        <span className="text-[10px] text-muted-foreground">
                          {formatRemainingTime(cooldownMs)}
                        </span>
                      )}
                    </div>
                  )}
                  {!coachingReport && !coaching.isPending && (
                    <Button
                      size="sm"
                      onClick={() => coaching.mutate()}
                      disabled={coaching.isPending}
                    >
                      <span className="material-symbols-outlined mr-1 text-sm">
                        auto_awesome
                      </span>
                      AI 코칭 분석 시작
                    </Button>
                  )}
                </div>

                {/* Initial state */}
                {!coachingReport && !coaching.isPending && !coaching.isError && (
                  <p className="text-xs text-muted-foreground">
                    완료된 세션의 AI 리포트를 종합 분석하여 장기 성장 추이와 맞춤 학습 계획을 제공합니다.
                  </p>
                )}

                {/* Loading */}
                {coaching.isPending && (
                  <div className="flex flex-col items-center justify-center gap-2 py-8">
                    <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="text-xs text-muted-foreground">
                      AI가 모든 세션 데이터를 분석하고 있습니다...
                    </p>
                  </div>
                )}

                {/* Error */}
                {coaching.isError && !coachingReport && (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <p className="text-xs text-destructive">
                      {coaching.error?.message ?? "코칭 분석에 실패했습니다."}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => coaching.mutate()}
                    >
                      다시 시도
                    </Button>
                  </div>
                )}

                {/* Result */}
                {coachingReport && !coaching.isPending && (
                  <CoachingReportCard report={coachingReport} />
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function CoachingReportCard({ report }: { report: CoachingReport }) {
  const scoreColor =
    report.readinessScore >= 8
      ? "text-emerald-600 dark:text-emerald-400"
      : report.readinessScore >= 5
        ? "text-amber-600 dark:text-amber-400"
        : "text-rose-600 dark:text-rose-400";

  return (
    <div className="space-y-4">
      {/* Header: Score + Overall Assessment */}
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center">
          <span className={`text-3xl font-black ${scoreColor}`}>
            {report.readinessScore}
          </span>
          <span className="text-[10px] text-muted-foreground">/10</span>
        </div>
        <div className="flex-1">
          <h5 className="mb-1 text-xs font-semibold text-foreground">종합 평가</h5>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {report.overallAssessment}
          </p>
        </div>
      </div>

      {/* Growth Trajectory */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950">
        <div className="mb-1 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm text-blue-600 dark:text-blue-400">
            trending_up
          </span>
          <h5 className="text-xs font-semibold text-blue-700 dark:text-blue-300">
            성장 궤적
          </h5>
        </div>
        <p className="text-xs leading-relaxed text-blue-700 dark:text-blue-300">
          {report.growthTrajectory}
        </p>
      </div>

      {/* Persistent Strengths & Weaknesses */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950">
          <h5 className="mb-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            지속적 강점
          </h5>
          <ul className="space-y-1">
            {report.persistentStrengths.map((s, i) => (
              <li
                key={i}
                className="flex items-start gap-1.5 text-xs text-emerald-700 dark:text-emerald-300"
              >
                <span className="mt-0.5 text-emerald-500">+</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 dark:border-rose-800 dark:bg-rose-950">
          <h5 className="mb-2 text-xs font-semibold text-rose-700 dark:text-rose-300">
            반복적 약점
          </h5>
          <ul className="space-y-1">
            {report.persistentWeaknesses.map((w, i) => (
              <li
                key={i}
                className="flex items-start gap-1.5 text-xs text-rose-700 dark:text-rose-300"
              >
                <span className="mt-0.5 text-rose-500">-</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Learning Plan */}
      <div>
        <h5 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <span className="material-symbols-outlined text-sm text-primary">
            school
          </span>
          맞춤 학습 계획
        </h5>
        <div className="space-y-2">
          {report.learningPlan.map((item) => (
            <div
              key={item.priority}
              className="rounded-lg border bg-card p-3"
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {item.priority}
                </span>
                <span className="text-xs font-semibold text-foreground">
                  {item.area}
                </span>
              </div>
              <p className="mb-1 text-xs leading-relaxed text-muted-foreground">
                {item.action}
              </p>
              <p className="text-[10px] italic text-muted-foreground/70">
                {item.reason}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Next Steps */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
        <div className="mb-1 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm text-amber-600 dark:text-amber-400">
            flag
          </span>
          <h5 className="text-xs font-semibold text-amber-700 dark:text-amber-300">
            다음 단계
          </h5>
        </div>
        <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-300">
          {report.nextSteps}
        </p>
      </div>
    </div>
  );
}
