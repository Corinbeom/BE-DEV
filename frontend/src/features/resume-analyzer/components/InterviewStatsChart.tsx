"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import type { BadgeStats } from "@/features/resume-analyzer/api/types";

interface InterviewStatsChartProps {
  badgeStats: BadgeStats[];
}

export function InterviewStatsChart({ badgeStats }: InterviewStatsChartProps) {
  const data = badgeStats.map((b) => ({
    badge: b.badge,
    avgStrengths: Math.round(b.avgStrengths * 100) / 100,
    avgImprovements: Math.round(b.avgImprovements * 100) / 100,
    practiceRate: Math.round(b.practiceRate * 100),
    totalQuestions: b.totalQuestions,
    attemptedQuestions: b.attemptedQuestions,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
        <XAxis
          dataKey="badge"
          tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<ChartTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11 }}
        />
        <Bar
          dataKey="avgStrengths"
          name="평균 강점"
          fill="var(--color-emerald-500, #10b981)"
          radius={[4, 4, 0, 0]}
          animationDuration={800}
        />
        <Bar
          dataKey="avgImprovements"
          name="평균 개선점"
          fill="var(--color-rose-500, #f43f5e)"
          radius={[4, 4, 0, 0]}
          animationDuration={800}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    payload: {
      badge: string;
      avgStrengths: number;
      avgImprovements: number;
      practiceRate: number;
      totalQuestions: number;
      attemptedQuestions: number;
    };
  }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-semibold text-foreground">{d.badge}</p>
      <p className="text-muted-foreground">
        연습률 <span className="font-bold text-primary">{d.practiceRate}%</span>
        <span className="ml-1 text-muted-foreground">
          ({d.attemptedQuestions}/{d.totalQuestions})
        </span>
      </p>
      <p className="text-muted-foreground">
        강점 <span className="font-bold text-emerald-500">{d.avgStrengths}</span>개
        {" / "}
        개선점 <span className="font-bold text-rose-500">{d.avgImprovements}</span>개
      </p>
    </div>
  );
}
