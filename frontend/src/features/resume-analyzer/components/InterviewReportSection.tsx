"use client";

import { useMemo, useState } from "react";
import type { ResumeInterviewStats, BadgeStats, FrequentItem } from "@/features/resume-analyzer/api/types";
import { InterviewStatsChart } from "./InterviewStatsChart";
import { InterviewTrendChart } from "./InterviewTrendChart";
import { cn } from "@/lib/utils";

const C = {
  green: "oklch(0.52 0.18 150)",
  amber: "oklch(0.58 0.18 60)",
  rose: "oklch(0.55 0.18 25)",
  primary: "oklch(0.385 0.175 280)",
} as const;

function badgeBorderColor(b: BadgeStats): string {
  if (b.attemptedQuestions === 0) return "var(--color-border)";
  if (b.avgStrengths >= b.avgImprovements * 1.2) return C.green;
  if (b.avgImprovements >= b.avgStrengths * 1.2) return C.amber;
  return C.primary;
}

function badgeDotStyle(b: BadgeStats): { background: string } {
  if (b.attemptedQuestions === 0) return { background: "oklch(0.7 0 0)" };
  if (b.avgStrengths >= b.avgImprovements * 1.2) return { background: C.green };
  if (b.avgImprovements >= b.avgStrengths * 1.2) return { background: C.amber };
  return { background: C.primary };
}

export function InterviewReportSection({ stats }: { stats: ResumeInterviewStats }) {
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);

  const insights = useMemo(() => {
    const practiced = [...stats.badgeStats].filter((b) => b.attemptedQuestions > 0);
    if (practiced.length === 0) return null;
    const strongest = [...practiced].sort((a, b) => b.avgStrengths - a.avgStrengths)[0];
    const weakest = [...practiced].sort((a, b) => b.avgImprovements - a.avgImprovements)[0];
    const unpracticed = stats.badgeStats
      .filter((b) => b.practiceRate < 0.3)
      .sort((a, b) => a.practiceRate - b.practiceRate);
    return { strongest, weakest, unpracticed };
  }, [stats]);

  const practiceRatePct = Math.round(stats.practiceRate * 100);
  const rateColor =
    practiceRatePct >= 70 ? C.green : practiceRatePct >= 40 ? C.amber : C.rose;

  return (
    <div className="flex flex-col gap-5">
      {/* ── Hero Stat Tiles ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
          <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <span className="material-symbols-outlined text-[18px]">quiz</span>
          </div>
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {stats.totalQuestions}
          </p>
          <p className="text-sm text-muted-foreground">총 문항</p>
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-[18px]">task_alt</span>
          </div>
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {stats.attemptedQuestions}
          </p>
          <p className="text-sm text-muted-foreground">완료 문항</p>
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
          <div
            className="flex size-8 items-center justify-center rounded-lg text-white"
            style={{ background: rateColor }}
          >
            <span className="material-symbols-outlined text-[18px]">percent</span>
          </div>
          <p className="text-2xl font-bold tracking-tight" style={{ color: rateColor }}>
            {practiceRatePct}%
          </p>
          <p className="text-sm text-muted-foreground">연습률</p>
        </div>
      </div>

      {/* ── Practice Rate Bar ── */}
      <div className="rounded-xl border border-border bg-card px-5 py-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-muted-foreground">전체 연습 현황</p>
          <span className="text-sm font-bold text-foreground">
            {stats.attemptedQuestions} / {stats.totalQuestions} 문항
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.max(practiceRatePct, 1)}%`, background: C.primary }}
          />
        </div>
      </div>

      {/* ── Insight Tiles ── */}
      {insights && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Strongest */}
          <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
            <div
              className="flex size-8 shrink-0 items-center justify-center rounded-lg"
              style={{ background: `color-mix(in oklab, ${C.green} 15%, transparent)` }}
            >
              <span className="material-symbols-outlined text-[18px]" style={{ color: C.green }}>
                emoji_events
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold" style={{ color: C.green }}>
                가장 강한 영역
              </p>
              {insights.strongest && insights.strongest.avgStrengths > 0 ? (
                <>
                  <p className="mt-0.5 truncate text-sm font-bold text-foreground">
                    {insights.strongest.badge}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    강점 평균 {Math.round(insights.strongest.avgStrengths * 100) / 100}개
                  </p>
                </>
              ) : (
                <p className="mt-0.5 text-xs text-muted-foreground">아직 데이터가 없어요.</p>
              )}
            </div>
          </div>

          {/* Weakest */}
          <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
            <div
              className="flex size-8 shrink-0 items-center justify-center rounded-lg"
              style={{ background: `color-mix(in oklab, ${C.amber} 15%, transparent)` }}
            >
              <span className="material-symbols-outlined text-[18px]" style={{ color: C.amber }}>
                target
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold" style={{ color: C.amber }}>
                집중 개선 영역
              </p>
              {insights.weakest && insights.weakest.avgImprovements > 0 ? (
                <>
                  <p className="mt-0.5 truncate text-sm font-bold text-foreground">
                    {insights.weakest.badge}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    개선점 평균 {Math.round(insights.weakest.avgImprovements * 100) / 100}개
                  </p>
                </>
              ) : (
                <p className="mt-0.5 text-xs text-muted-foreground">아직 데이터가 없어요.</p>
              )}
            </div>
          </div>

          {/* Unpracticed */}
          <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <span className="material-symbols-outlined text-[18px]">pending</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted-foreground">연습 권장</p>
              {insights.unpracticed.length > 0 ? (
                <>
                  <p className="mt-0.5 text-sm font-bold text-foreground">
                    {insights.unpracticed.length}개 영역
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {insights.unpracticed.slice(0, 2).map((b) => b.badge).join(", ")}
                    {insights.unpracticed.length > 2
                      ? ` 외 ${insights.unpracticed.length - 2}개`
                      : ""}
                  </p>
                </>
              ) : (
                <p className="mt-0.5 text-sm font-bold text-foreground">모두 연습 완료!</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Badge Grid ── */}
      {stats.badgeStats.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">유형별 상세 분석</p>
            <span className="text-xs text-muted-foreground">클릭하여 상세 보기</span>
          </div>

          {/* Compact 2-3 col grid */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {stats.badgeStats.map((b) => (
              <button
                key={b.badge}
                onClick={() =>
                  setSelectedBadge((prev) => (prev === b.badge ? null : b.badge))
                }
                className={cn(
                  "rounded-xl border border-border bg-card border-l-[3px] px-4 py-3 text-left transition-all hover:bg-accent/30",
                  selectedBadge === b.badge &&
                    "bg-accent/20 ring-2 ring-inset ring-primary/30"
                )}
                style={{ borderLeftColor: badgeBorderColor(b) }}
              >
                <div className="mb-2 flex items-center justify-between gap-1">
                  <span className="truncate text-sm font-semibold text-foreground">
                    {b.badge}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {b.attemptedQuestions}/{b.totalQuestions}
                  </span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(b.practiceRate * 100, b.attemptedQuestions > 0 ? 3 : 0)}%`,
                      background: C.primary,
                    }}
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {Math.round(b.practiceRate * 100)}%
                  </span>
                  <span>
                    <span style={{ color: C.green }}>
                      {Math.round(b.avgStrengths * 10) / 10}
                    </span>
                    {" · "}
                    <span style={{ color: C.amber }}>
                      {Math.round(b.avgImprovements * 10) / 10}
                    </span>
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Selected badge detail panel */}
          <SelectedBadgePanel
            badgeStats={stats.badgeStats}
            selectedBadge={selectedBadge}
            onClose={() => setSelectedBadge(null)}
          />
        </div>
      )}

      {/* ── Charts (하단) ── */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-muted-foreground">배지별 비교</p>
          <span className="text-sm text-muted-foreground">강점 vs 개선점</span>
        </div>
        <InterviewStatsChart badgeStats={stats.badgeStats} />
      </div>

      {stats.weeklyTrends && stats.weeklyTrends.length > 1 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-muted-foreground">주간 변화 추이</p>
            <span className="text-sm text-muted-foreground">
              최근 {stats.weeklyTrends.length}주
            </span>
          </div>
          <InterviewTrendChart weeklyTrends={stats.weeklyTrends} />
        </div>
      )}
    </div>
  );
}

// ── 선택 배지 상세 패널 ────────────────────────────────────────

function SelectedBadgePanel({
  badgeStats,
  selectedBadge,
  onClose,
}: {
  badgeStats: BadgeStats[];
  selectedBadge: string | null;
  onClose: () => void;
}) {
  if (!selectedBadge) return null;
  const b = badgeStats.find((b) => b.badge === selectedBadge);
  if (!b) return null;

  return (
    <div className="mt-2 rounded-xl border border-border bg-card px-5 py-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full" style={badgeDotStyle(b)} />
          <h5 className="text-sm font-bold text-foreground">{b.badge}</h5>
          <span className="text-xs text-muted-foreground">
            연습률 {Math.round(b.practiceRate * 100)}% ({b.attemptedQuestions}/{b.totalQuestions})
          </span>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="닫기"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
      <BadgeDetail
        strengths={b.topStrengths ?? []}
        improvements={b.topImprovements ?? []}
      />
    </div>
  );
}

// ── 빈도 바 차트 컴포넌트 ──────────────────────────────────────

function BadgeDetail({
  strengths,
  improvements,
}: {
  strengths: FrequentItem[];
  improvements: FrequentItem[];
}) {
  const topStrengths = strengths.slice(0, 3);
  const topImprovements = improvements.slice(0, 3);
  const hasStrengths = topStrengths.length > 0;
  const hasImprovements = topImprovements.length > 0;

  if (!hasStrengths && !hasImprovements) {
    return (
      <p className="text-sm text-muted-foreground">아직 분석 데이터가 없어요.</p>
    );
  }

  const maxStrengthFreq = hasStrengths
    ? Math.max(...topStrengths.map((s) => s.frequency))
    : 1;
  const maxImprovementFreq = hasImprovements
    ? Math.max(...topImprovements.map((i) => i.frequency))
    : 1;

  const showStrengthBars =
    topStrengths.length > 1 &&
    !topStrengths.every((s) => s.frequency === topStrengths[0]?.frequency);
  const showImprovementBars =
    topImprovements.length > 1 &&
    !topImprovements.every((i) => i.frequency === topImprovements[0]?.frequency);

  if (!hasStrengths) {
    return (
      <FreqColumn
        label="빈출 개선점"
        color={C.amber}
        items={topImprovements}
        maxFreq={maxImprovementFreq}
        showBars={showImprovementBars}
      />
    );
  }
  if (!hasImprovements) {
    return (
      <FreqColumn
        label="빈출 강점"
        color={C.green}
        items={topStrengths}
        maxFreq={maxStrengthFreq}
        showBars={showStrengthBars}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 sm:gap-y-0">
      <FreqColumn
        label="빈출 강점"
        color={C.green}
        items={topStrengths}
        maxFreq={maxStrengthFreq}
        showBars={showStrengthBars}
      />
      <FreqColumn
        label="빈출 개선점"
        color={C.amber}
        items={topImprovements}
        maxFreq={maxImprovementFreq}
        showBars={showImprovementBars}
      />
    </div>
  );
}

function FreqColumn({
  label,
  color,
  items,
  maxFreq,
  showBars,
}: {
  label: string;
  color: string;
  items: FrequentItem[];
  maxFreq: number;
  showBars: boolean;
}) {
  return (
    <div>
      <p className="mb-2.5 text-sm font-semibold" style={{ color }}>
        {label}
      </p>
      <div className="flex flex-col gap-2.5">
        {items.map((item, i) => (
          <div key={i}>
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm text-foreground" title={item.text}>
                {item.text}
              </span>
              <span className="shrink-0 font-mono text-xs text-muted-foreground">
                {item.frequency}회
              </span>
            </div>
            {showBars && (
              <div
                className="mt-1 h-1.5 w-full overflow-hidden rounded-full"
                style={{ background: `color-mix(in oklab, ${color} 18%, transparent)` }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.round((item.frequency / Math.max(maxFreq, 1)) * 100)}%`,
                    background: `color-mix(in oklab, ${color} 55%, transparent)`,
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
