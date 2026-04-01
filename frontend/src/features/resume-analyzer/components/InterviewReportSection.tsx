"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ResumeInterviewStats } from "@/features/resume-analyzer/api/types";
import { InterviewStatsChart } from "./InterviewStatsChart";
import { InterviewTrendChart } from "./InterviewTrendChart";

interface InterviewReportSectionProps {
  stats: ResumeInterviewStats;
}

export function InterviewReportSection({ stats }: InterviewReportSectionProps) {
  const insights = useMemo(() => {
    const sorted = [...stats.badgeStats].filter((b) => b.attemptedQuestions > 0);
    if (sorted.length === 0) return null;

    const strongest = [...sorted].sort((a, b) => b.avgStrengths - a.avgStrengths)[0];
    const weakest = [...sorted].sort((a, b) => b.avgImprovements - a.avgImprovements)[0];
    const unpracticed = stats.badgeStats
      .filter((b) => b.practiceRate < 0.3)
      .sort((a, b) => a.practiceRate - b.practiceRate);

    return { strongest, weakest, unpracticed };
  }, [stats]);

  return (
    <div className="space-y-4">
      {/* Section 1: Summary */}
      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">
              면접 연습 종합 리포트
            </h4>
            <span className="text-xs text-muted-foreground">
              {stats.attemptedQuestions}/{stats.totalQuestions}문항 완료
            </span>
          </div>

          {/* Practice rate progress bar */}
          <div className="mb-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">전체 연습률</span>
              <span className="text-xs font-bold text-foreground">
                {Math.round(stats.practiceRate * 100)}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${Math.max(stats.practiceRate * 100, 1)}%` }}
              />
            </div>
          </div>

          {/* Auto-generated insights */}
          {insights && (
            <div className="space-y-1.5 text-xs text-muted-foreground">
              {insights.strongest && insights.strongest.avgStrengths > 0 && (
                <p>
                  가장 강한 영역:{" "}
                  <Badge variant="outline" className="border-emerald-200 text-emerald-600 dark:border-emerald-800 dark:text-emerald-400">
                    {insights.strongest.badge}
                  </Badge>
                  <span className="ml-1">
                    (강점 평균 {Math.round(insights.strongest.avgStrengths * 100) / 100}개)
                  </span>
                </p>
              )}
              {insights.weakest && insights.weakest.avgImprovements > 0 && (
                <p>
                  집중 개선 영역:{" "}
                  <Badge variant="outline" className="border-rose-200 text-rose-500 dark:border-rose-800">
                    {insights.weakest.badge}
                  </Badge>
                  <span className="ml-1">
                    (개선점 평균 {Math.round(insights.weakest.avgImprovements * 100) / 100}개)
                  </span>
                </p>
              )}
              {insights.unpracticed.length > 0 && (
                <p>
                  연습 권장:{" "}
                  {insights.unpracticed.map((b) => (
                    <Badge
                      key={b.badge}
                      variant="outline"
                      className="mr-1 border-amber-200 text-amber-600 dark:border-amber-800 dark:text-amber-400"
                    >
                      {b.badge}
                    </Badge>
                  ))}
                  <span className="text-muted-foreground">
                    (연습률 30% 미만)
                  </span>
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 2: Badge detail cards */}
      {stats.badgeStats.length > 0 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {stats.badgeStats.map((b) => (
            <Card key={b.badge}>
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h5 className="text-sm font-semibold text-foreground">{b.badge}</h5>
                  <span className="text-[10px] text-muted-foreground">
                    {b.attemptedQuestions}/{b.totalQuestions}
                  </span>
                </div>

                {/* Mini progress bar */}
                <div className="mb-2.5">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary/70 transition-all duration-500"
                      style={{ width: `${Math.max(b.practiceRate * 100, 1)}%` }}
                    />
                  </div>
                  <div className="mt-0.5 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>연습률 {Math.round(b.practiceRate * 100)}%</span>
                    <span>
                      강점 {Math.round(b.avgStrengths * 100) / 100} / 개선점 {Math.round(b.avgImprovements * 100) / 100}
                    </span>
                  </div>
                </div>

                {/* Top strengths chips */}
                {b.topStrengths && b.topStrengths.length > 0 && (
                  <div className="mb-1.5">
                    <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">빈출 강점</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {b.topStrengths.map((item, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          title={item.text}
                        >
                          {item.text.length > 40 ? item.text.slice(0, 40) + "…" : item.text}
                          <span className="ml-1 font-bold">x{item.frequency}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top improvements chips */}
                {b.topImprovements && b.topImprovements.length > 0 && (
                  <div>
                    <span className="text-[10px] font-medium text-rose-500 dark:text-rose-400">빈출 개선점</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {b.topImprovements.map((item, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[10px] text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          title={item.text}
                        >
                          {item.text.length > 40 ? item.text.slice(0, 40) + "…" : item.text}
                          <span className="ml-1 font-bold">x{item.frequency}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Section 3: Weekly trend */}
      {stats.weeklyTrends && stats.weeklyTrends.length > 1 && (
        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground">
                주간 변화 추이
              </h4>
              <span className="text-xs text-muted-foreground">
                최근 {stats.weeklyTrends.length}주
              </span>
            </div>
            <InterviewTrendChart weeklyTrends={stats.weeklyTrends} />
          </CardContent>
        </Card>
      )}

      {/* Section 4: Badge comparison bar chart */}
      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">
              배지별 비교
            </h4>
            <span className="text-xs text-muted-foreground">
              강점 vs 개선점
            </span>
          </div>
          <InterviewStatsChart badgeStats={stats.badgeStats} />
        </CardContent>
      </Card>
    </div>
  );
}
