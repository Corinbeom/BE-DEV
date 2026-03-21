"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { TopicAccuracy } from "@/features/study-quiz/api/types";
import { TOPICS } from "@/features/study-quiz/constants";

interface TopicRadarChartProps {
  topicAccuracies: TopicAccuracy[];
}

export function TopicRadarChart({ topicAccuracies }: TopicRadarChartProps) {
  const accuracyMap = new Map(topicAccuracies.map((t) => [t.topic, t]));

  const data = TOPICS.map((t) => {
    const stat = accuracyMap.get(t.id);
    return {
      topic: t.label,
      accuracy: stat ? Math.round(stat.accuracy * 100) : 0,
      totalAttempts: stat?.totalAttempts ?? 0,
      correctCount: stat?.correctCount ?? 0,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={240}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="72%">
        <PolarGrid strokeOpacity={0.3} />
        <PolarAngleAxis
          dataKey="topic"
          tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
        />
        <Radar
          dataKey="accuracy"
          stroke="var(--color-primary)"
          fill="var(--color-primary)"
          fillOpacity={0.2}
          strokeWidth={2}
          dot={{ r: 3, fill: "var(--color-primary)", strokeWidth: 0 }}
          activeDot={{
            r: 5,
            fill: "var(--color-primary)",
            stroke: "var(--color-background)",
            strokeWidth: 2,
          }}
          animationDuration={800}
          animationEasing="ease-out"
        />
        <Tooltip content={<RadarTooltip />} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

function RadarTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    payload: {
      topic: string;
      accuracy: number;
      totalAttempts: number;
      correctCount: number;
    };
  }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-semibold text-foreground">{d.topic}</p>
      <p className="text-muted-foreground">
        정답률 <span className="font-bold text-primary">{d.accuracy}%</span>
      </p>
      <p className="text-muted-foreground">
        {d.correctCount}/{d.totalAttempts}문항 정답
      </p>
    </div>
  );
}
