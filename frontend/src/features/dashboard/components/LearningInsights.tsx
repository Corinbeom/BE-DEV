"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import type { CsQuizSession } from "@/features/study-quiz/api/types";
import type { ResumeSession } from "@/features/resume-analyzer/api/types";
import { TOPICS, DIFFICULTY_META } from "@/features/study-quiz/constants";
import { useCsQuizStats } from "@/features/study-quiz/hooks/useCsQuizStats";
import { TopicRadarChart } from "./TopicRadarChart";

interface LearningInsightsProps {
  quizSessions: CsQuizSession[];
  resumeSessions: ResumeSession[];
}

export function LearningInsights({
  quizSessions,
  resumeSessions,
}: LearningInsightsProps) {
  const { data: statsData } = useCsQuizStats();

  const topicStats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of quizSessions) {
      for (const q of s.questions) {
        counts[q.topic] = (counts[q.topic] ?? 0) + 1;
      }
    }
    const max = Math.max(1, ...Object.values(counts));
    return TOPICS.map((t) => ({
      id: t.id,
      label: t.label,
      icon: t.icon,
      count: counts[t.id] ?? 0,
      pct: Math.round(((counts[t.id] ?? 0) / max) * 100),
    }));
  }, [quizSessions]);

  const weeklyStats = useMemo(() => {
    const now = new Date();
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      return d;
    });

    const quizDates = quizSessions.map((s) => new Date(s.createdAt));
    const resumeDates = resumeSessions.map((s) => new Date(s.createdAt));

    const dayData = days.map((day) => {
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      const quizCount = quizDates.filter((d) => d >= day && d < nextDay).length;
      const resumeCount = resumeDates.filter((d) => d >= day && d < nextDay).length;
      return { quizCount, resumeCount, total: quizCount + resumeCount };
    });

    const totalQuestions =
      quizSessions.reduce((sum, s) => sum + s.questions.length, 0) +
      resumeSessions.reduce((sum, s) => sum + s.questions.length, 0);

    const weekSessions = dayData.reduce((a, b) => a + b.total, 0);
    const maxDay = Math.max(1, ...dayData.map((d) => d.total));

    return { days, dayData, weekSessions, totalQuestions, maxDay };
  }, [quizSessions, resumeSessions]);

  const streak = useMemo(() => {
    const dates = new Set<string>();
    for (const s of quizSessions) {
      dates.add(new Date(s.createdAt).toLocaleDateString("ko-KR"));
    }
    for (const s of resumeSessions) {
      dates.add(new Date(s.createdAt).toLocaleDateString("ko-KR"));
    }

    let count = 0;
    const d = new Date();
    if (!dates.has(d.toLocaleDateString("ko-KR"))) {
      d.setDate(d.getDate() - 1);
    }
    while (dates.has(d.toLocaleDateString("ko-KR"))) {
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  }, [quizSessions, resumeSessions]);

  const difficultyStats = useMemo(() => {
    const counts: Record<string, number> = { LOW: 0, MID: 0, HIGH: 0 };
    for (const s of quizSessions) {
      counts[s.difficulty] = (counts[s.difficulty] ?? 0) + 1;
    }
    return (["LOW", "MID", "HIGH"] as const).map((id) => ({
      id,
      label: DIFFICULTY_META[id]?.label ?? id,
      color: DIFFICULTY_META[id]?.color ?? "",
      count: counts[id],
    }));
  }, [quizSessions]);

  const totalQuizQuestions = quizSessions.reduce(
    (sum, s) => sum + s.questions.length,
    0
  );
  const totalResumeQuestions = resumeSessions.reduce(
    (sum, s) => sum + s.questions.length,
    0
  );

  const hasAnyData = quizSessions.length > 0 || resumeSessions.length > 0;
  const hasRadarData = (statsData?.totalAttempts ?? 0) > 0;

  if (!hasAnyData) return null;

  const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-lg text-primary">
          insights
        </span>
        <h3 className="text-lg font-bold tracking-tight text-foreground">
          학습 인사이트
        </h3>
      </div>

      {/* Summary Badges */}
      <div className="flex flex-wrap gap-2">
        {totalQuizQuestions > 0 && (
          <Badge variant="secondary" className="gap-1.5 px-3 py-1">
            <span className="material-symbols-outlined text-xs">quiz</span>
            CS 퀴즈 {totalQuizQuestions}문항
          </Badge>
        )}
        {totalResumeQuestions > 0 && (
          <Badge variant="secondary" className="gap-1.5 px-3 py-1">
            <span className="material-symbols-outlined text-xs">
              psychology
            </span>
            면접 질문 {totalResumeQuestions}개
          </Badge>
        )}
        {streak > 0 && (
          <Badge
            variant="secondary"
            className="gap-1.5 border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-700 dark:text-amber-400"
          >
            <span className="material-symbols-outlined text-xs">
              local_fire_department
            </span>
            {streak}일 연속 학습
          </Badge>
        )}
        {difficultyStats.map(
          (d) =>
            d.count > 0 && (
              <Badge
                key={d.id}
                variant="outline"
                className={`gap-1 px-2.5 py-1 ${d.color}`}
              >
                난이도 {d.label} {d.count}회
              </Badge>
            )
        )}
      </div>

      <div
        className={`grid grid-cols-1 gap-4 ${hasRadarData ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}
      >
        {/* Topic Distribution */}
        {quizSessions.length > 0 && (
          <Card>
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">
                  토픽별 학습 분포
                </h4>
                <span className="text-xs text-muted-foreground">
                  총 {totalQuizQuestions}문항
                </span>
              </div>

              <div className="space-y-2.5">
                {topicStats.map((t) => (
                  <div key={t.id} className="flex items-center gap-3">
                    <span className="material-symbols-outlined w-5 text-center text-sm text-muted-foreground">
                      {t.icon}
                    </span>
                    <span className="w-20 shrink-0 text-xs font-medium text-foreground">
                      {t.label}
                    </span>
                    <div className="relative h-5 flex-1 overflow-hidden rounded-full bg-muted">
                      {t.count > 0 ? (
                        <div
                          className="flex h-full items-center rounded-full bg-primary/80 transition-all duration-500"
                          style={{ width: `${Math.max(t.pct, 8)}%` }}
                        >
                          <span className="pl-2 text-[10px] font-bold text-primary-foreground">
                            {t.count}
                          </span>
                        </div>
                      ) : (
                        <span className="flex h-full items-center pl-2.5 text-[10px] text-muted-foreground">
                          미학습
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Weekly Activity — Stacked Bar with Tooltip */}
        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground">
                주간 학습 활동
              </h4>
              <span className="text-xs text-muted-foreground">
                이번 주 {weeklyStats.weekSessions}세션
              </span>
            </div>

            <TooltipProvider>
              <div className="flex items-end justify-between gap-2">
                {weeklyStats.days.map((day, i) => {
                  const { quizCount, resumeCount, total } =
                    weeklyStats.dayData[i];
                  const heightPct =
                    total > 0
                      ? Math.max((total / weeklyStats.maxDay) * 100, 15)
                      : 0;
                  const quizPct = total > 0 ? (quizCount / total) * heightPct : 0;
                  const resumePct = total > 0 ? (resumeCount / total) * heightPct : 0;
                  const isToday = i === 6;

                  const dateStr = day.toLocaleDateString("ko-KR", {
                    month: "long",
                    day: "numeric",
                  });
                  const dayLabel = `${dateStr} (${DAY_LABELS[day.getDay()]})`;

                  const bar = (
                    <div className="flex flex-1 flex-col items-center gap-1.5">
                      {total > 0 && (
                        <span className="text-[10px] font-semibold text-foreground">
                          {total}
                        </span>
                      )}
                      <div className="flex h-24 w-full items-end justify-center">
                        {total > 0 ? (
                          <div
                            className="flex w-full max-w-8 flex-col justify-end overflow-hidden rounded-t-md transition-all duration-500"
                            style={{ height: `${heightPct}%` }}
                          >
                            {resumeCount > 0 && (
                              <div
                                className={`w-full ${isToday ? "bg-violet-500" : "bg-violet-400/70"}`}
                                style={{
                                  height:
                                    heightPct > 0
                                      ? `${(resumePct / heightPct) * 100}%`
                                      : "0",
                                }}
                              />
                            )}
                            {quizCount > 0 && (
                              <div
                                className={`w-full ${isToday ? "bg-primary" : "bg-primary/50"}`}
                                style={{
                                  height:
                                    heightPct > 0
                                      ? `${(quizPct / heightPct) * 100}%`
                                      : "0",
                                }}
                              />
                            )}
                          </div>
                        ) : (
                          <div
                            className="w-full max-w-8 rounded-t-md bg-muted"
                            style={{ height: "4px" }}
                          />
                        )}
                      </div>
                      <span
                        className={`text-[10px] ${isToday ? "font-bold text-primary" : "text-muted-foreground"}`}
                      >
                        {DAY_LABELS[day.getDay()]}
                      </span>
                    </div>
                  );

                  if (total === 0) {
                    return <div key={i}>{bar}</div>;
                  }

                  return (
                    <Tooltip key={i}>
                      <TooltipTrigger render={<div />}>
                        {bar}
                      </TooltipTrigger>
                      <TooltipContent className="flex flex-col gap-0.5">
                        <p className="font-semibold">{dayLabel}</p>
                        {quizCount > 0 && <p>CS 퀴즈 {quizCount}세션</p>}
                        {resumeCount > 0 && <p>이력서 면접 {resumeCount}세션</p>}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </TooltipProvider>

            {/* Legend */}
            <div className="mt-3 flex items-center justify-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded-sm bg-primary" />
                <span className="text-[10px] text-muted-foreground">CS 퀴즈</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded-sm bg-violet-500" />
                <span className="text-[10px] text-muted-foreground">이력서 면접</span>
              </div>
            </div>

            {/* Resume Position Distribution (if data exists) */}
            {resumeSessions.length > 0 && (
              <div className="mt-5 border-t pt-4">
                <h4 className="mb-2.5 text-xs font-semibold text-muted-foreground">
                  이력서 포지션 분포
                </h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(
                    resumeSessions.reduce<Record<string, number>>((acc, s) => {
                      const key = s.positionType ?? "미지정";
                      acc[key] = (acc[key] ?? 0) + 1;
                      return acc;
                    }, {})
                  ).map(([position, count]) => (
                    <Badge
                      key={position}
                      variant="outline"
                      className="gap-1 px-2.5 py-1"
                    >
                      {position} {count}회
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Topic Accuracy Radar Chart */}
        {hasRadarData && statsData && (
          <Card>
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">
                  토픽별 정답률
                </h4>
                <span className="text-xs text-muted-foreground">
                  전체 {Math.round(statsData.overallAccuracy * 100)}%
                </span>
              </div>
              <TopicRadarChart topicAccuracies={statsData.topicAccuracies} />
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
