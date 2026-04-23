"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useResumeInterviewStats } from "../hooks/useResumeInterviewStats";
import { useCoachingReport } from "../hooks/useCoachingReport";
import { useGenerateCoachingReport } from "../hooks/useResumeMutations";
import { InterviewReportSection } from "./InterviewReportSection";
import type { CoachingReport, CoachingLearningPlanItem } from "../api/types";

const C = {
  green: "oklch(0.52 0.18 150)",
  amber: "oklch(0.58 0.18 60)",
  rose: "oklch(0.55 0.18 25)",
  primary: "oklch(0.385 0.175 280)",
} as const;

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

function getScoreColor(score: number): string {
  if (score >= 8) return C.green;
  if (score >= 5) return C.amber;
  return C.rose;
}

function ScoreRing({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(10, score)) * 10;
  const color = getScoreColor(score);
  return (
    <div
      className="relative flex size-20 shrink-0 items-center justify-center rounded-full"
      style={{
        background: `conic-gradient(${color} 0% ${pct}%, color-mix(in oklab, ${color} 25%, transparent) ${pct}% 100%)`,
      }}
    >
      <div className="flex size-[60px] flex-col items-center justify-center rounded-full bg-card">
        <span className="text-2xl font-black leading-none" style={{ color }}>
          {score}
        </span>
        <span className="text-xs text-muted-foreground">/10</span>
      </div>
    </div>
  );
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
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      {/* ── Header ── */}
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

      {/* ── Loading ── */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* ── Empty ── */}
      {!isLoading && !hasData && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-center">
          <span className="material-symbols-outlined text-4xl text-muted-foreground/40">
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

      {/* ── Main Content ── */}
      {!isLoading && hasData && stats && (
        <>
          <InterviewReportSection stats={stats} />

          {/* ── AI Coaching ── */}
          {!isLoadingCoaching && (
            <div className="rounded-xl border border-primary/20 bg-card">
              {/* Header bar */}
              <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-primary">
                    psychology
                  </span>
                  <p className="text-sm font-semibold text-muted-foreground">
                    AI 누적 코칭 분석
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {coachingReport && !coaching.isPending && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => coaching.mutate()}
                        disabled={coaching.isPending || isInCooldown}
                      >
                        <span className="material-symbols-outlined mr-1 text-sm">
                          refresh
                        </span>
                        재분석
                      </Button>
                      {isInCooldown && (
                        <span className="text-xs text-muted-foreground">
                          {formatRemainingTime(cooldownMs)}
                        </span>
                      )}
                    </>
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
              </div>

              {/* Body */}
              <div className="p-5">
                {!coachingReport && !coaching.isPending && !coaching.isError && (
                  <p className="text-sm text-muted-foreground">
                    완료된 세션의 AI 리포트를 종합 분석하여 장기 성장 추이와 맞춤
                    학습 계획을 제공합니다.
                  </p>
                )}

                {coaching.isPending && (
                  <div className="flex flex-col items-center justify-center gap-2 py-8">
                    <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">
                      AI가 모든 세션 데이터를 분석하고 있습니다...
                    </p>
                  </div>
                )}

                {coaching.isError && !coachingReport && (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <p className="text-sm text-destructive">
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

                {coachingReport && !coaching.isPending && (
                  <CoachingReportCard report={coachingReport} />
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CoachingReportCard({ report }: { report: CoachingReport }) {
  return (
    <div className="flex flex-col gap-5">
      {/* ── Score + Assessment ── */}
      <div className="flex items-start gap-5">
        <ScoreRing score={report.readinessScore} />
        <div className="flex-1">
          <p className="text-sm font-semibold text-muted-foreground">종합 평가</p>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground">
            {report.overallAssessment}
          </p>
        </div>
      </div>

      {/* ── Growth Trajectory ── */}
      <div className="rounded-xl border border-border bg-background px-4 py-4">
        <div className="mb-2 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-base text-muted-foreground">
            trending_up
          </span>
          <p className="text-sm font-semibold text-muted-foreground">성장 궤적</p>
        </div>
        <p className="text-sm leading-relaxed text-foreground">
          {report.growthTrajectory}
        </p>
      </div>

      {/* ── Strengths & Weaknesses ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-background px-4 py-4">
          <p className="mb-3 text-sm font-semibold" style={{ color: C.green }}>
            지속적 강점
          </p>
          {report.persistentStrengths.length === 0 ? (
            <p className="text-sm text-muted-foreground">강점 데이터가 없어요.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {report.persistentStrengths.map((s, i) => (
                <span
                  key={i}
                  className="rounded-md px-2.5 py-1 text-sm font-medium"
                  style={{
                    background: `color-mix(in oklab, ${C.green} 12%, transparent)`,
                    color: C.green,
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-background px-4 py-4">
          <p className="mb-3 text-sm font-semibold" style={{ color: C.amber }}>
            반복적 약점
          </p>
          {report.persistentWeaknesses.length === 0 ? (
            <p className="text-sm text-muted-foreground">약점 데이터가 없어요.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {report.persistentWeaknesses.map((w, i) => (
                <span
                  key={i}
                  className="rounded-md px-2.5 py-1 text-sm font-medium"
                  style={{
                    background: `color-mix(in oklab, ${C.amber} 12%, transparent)`,
                    color: C.amber,
                  }}
                >
                  {w}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Learning Plan ── */}
      {report.learningPlan.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base text-primary">school</span>
            <p className="text-sm font-semibold text-muted-foreground">맞춤 학습 계획</p>
          </div>
          <div className="flex flex-col gap-2">
            {report.learningPlan.map((item) => (
              <LearningPlanItem key={item.priority} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* ── Next Steps ── */}
      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-4">
        <span className="material-symbols-outlined mt-0.5 text-[18px] text-primary">
          flag
        </span>
        <div>
          <p className="text-sm font-semibold text-primary">다음 단계</p>
          <p className="mt-1 text-sm leading-relaxed text-foreground">
            {report.nextSteps}
          </p>
        </div>
      </div>
    </div>
  );
}

function LearningPlanItem({ item }: { item: CoachingLearningPlanItem }) {
  const priorityColor =
    item.priority === 1 ? C.rose : item.priority === 2 ? C.amber : C.primary;

  return (
    <div
      className="overflow-hidden rounded-xl border border-border border-l-[3px] bg-background"
      style={{ borderLeftColor: priorityColor }}
    >
      <div className="px-4 py-3.5">
        <div className="mb-2 flex items-center gap-2">
          <span
            className="flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ background: priorityColor }}
          >
            {item.priority}
          </span>
          <span className="text-sm font-semibold text-foreground">{item.area}</span>
        </div>
        <p className="mb-1.5 text-sm leading-relaxed text-muted-foreground">
          {item.action}
        </p>
        <p className="text-xs italic text-muted-foreground/70">{item.reason}</p>
      </div>
    </div>
  );
}
