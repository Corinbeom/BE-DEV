"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import type { WeeklyTrend } from "@/features/resume-analyzer/api/types";

interface InterviewTrendChartProps {
  weeklyTrends: WeeklyTrend[];
}

export function InterviewTrendChart({ weeklyTrends }: InterviewTrendChartProps) {
  const data = weeklyTrends.map((w) => {
    const d = new Date(w.weekStart + "T00:00:00");
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    return {
      label,
      weekStart: w.weekStart,
      attemptCount: w.attemptCount,
      avgStrengths: Math.round(w.avgStrengths * 100) / 100,
      avgImprovements: Math.round(w.avgImprovements * 100) / 100,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
        <XAxis
          dataKey="label"
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
        <Tooltip content={<TrendTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11 }}
        />
        <Line
          type="monotone"
          dataKey="avgStrengths"
          name="평균 강점"
          stroke="var(--color-emerald-500, #10b981)"
          strokeWidth={2}
          dot={{ r: 3, fill: "var(--color-emerald-500, #10b981)", strokeWidth: 0 }}
          activeDot={{ r: 5, stroke: "var(--color-background)", strokeWidth: 2 }}
          animationDuration={800}
        />
        <Line
          type="monotone"
          dataKey="avgImprovements"
          name="평균 개선점"
          stroke="var(--color-rose-500, #f43f5e)"
          strokeWidth={2}
          dot={{ r: 3, fill: "var(--color-rose-500, #f43f5e)", strokeWidth: 0 }}
          activeDot={{ r: 5, stroke: "var(--color-background)", strokeWidth: 2 }}
          animationDuration={800}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function TrendTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    payload: {
      label: string;
      weekStart: string;
      attemptCount: number;
      avgStrengths: number;
      avgImprovements: number;
    };
  }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-semibold text-foreground">{d.weekStart} 주간</p>
      <p className="text-muted-foreground">
        답변 <span className="font-bold text-primary">{d.attemptCount}</span>건
      </p>
      <p className="text-muted-foreground">
        강점 <span className="font-bold text-emerald-500">{d.avgStrengths}</span>개
        {" / "}
        개선점 <span className="font-bold text-rose-500">{d.avgImprovements}</span>개
      </p>
    </div>
  );
}
