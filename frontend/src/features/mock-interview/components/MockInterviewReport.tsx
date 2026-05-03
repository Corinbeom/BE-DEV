"use client";

import Link from "next/link";
import type { AnswerRecord } from "../hooks/useMockInterview";
import type { BehavioralMetrics } from "../hooks/useBehavioralAnalysis";
import { cn } from "@/lib/utils";

type Props = {
  answers: AnswerRecord[];
  sessionId: number;
  sessionTitle: string;
  behavioralMetrics: BehavioralMetrics | null;
  onRestart: () => void;
};

export function MockInterviewReport({ answers, sessionId, sessionTitle, behavioralMetrics, onRestart }: Props) {
  const totalAnswered = answers.filter((a) => a.answerText && a.answerText !== "(답변 없음)").length;
  const participationRate = answers.length > 0 ? Math.round((totalAnswered / answers.length) * 100) : 0;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-16">
      <div className="w-full max-w-lg">

        {/* 완료 헤더 */}
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20">
            <span className="material-symbols-outlined text-3xl text-blue-400">check_circle</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">면접이 완료됐습니다</h1>
            <p className="mt-1 text-sm text-white/40">{sessionTitle}</p>
          </div>
        </div>

        {/* 요약 스탯 */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <StatCard value={String(answers.length)} label="전체 질문" />
          <StatCard value={String(totalAnswered)} label="답변 완료" color="text-blue-400" />
          <StatCard value={`${participationRate}%`} label="참여율" color="text-green-400" />
        </div>

        {/* 행동 분석 패널 (카메라 사용 시) */}
        {behavioralMetrics && <BehavioralPanel metrics={behavioralMetrics} />}

        {/* AI 피드백 안내 */}
        <div className="mb-6 rounded-2xl border border-white/8 bg-white/[0.03] p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-amber-400">auto_awesome</span>
            <p className="text-sm font-semibold text-white/70">AI 피드백 확인</p>
          </div>
          <p className="text-xs leading-relaxed text-white/45">
            각 질문에 대한 AI 피드백(강점·개선점·모범 답변)은 이력서 연습 페이지에서 확인할 수 있습니다.
            질문별로 순차 처리되므로 잠시 기다리면 결과가 표시됩니다.
          </p>
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-col gap-3">
          <Link
            href={`/resume-analyzer/practice?sessionId=${sessionId}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500 transition-all"
          >
            <span className="material-symbols-outlined text-sm">rate_review</span>
            AI 피드백 확인하기
          </Link>
          <button
            onClick={onRestart}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white/50 hover:bg-white/10 hover:text-white/70 transition-all"
          >
            다시 시작
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ value, label, color }: { value: string; label: string; color?: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.04] p-4 text-center">
      <p className={cn("text-2xl font-bold", color ?? "text-white")}>{value}</p>
      <p className="mt-1 text-xs text-white/40">{label}</p>
    </div>
  );
}

function BehavioralPanel({ metrics }: { metrics: BehavioralMetrics }) {
  const items = [
    { label: "시선 안정성", value: metrics.eyeContactRatio, icon: "visibility" },
    { label: "자세 안정성", value: metrics.postureStability, icon: "self_improvement" },
    { label: "표정 다양성", value: metrics.expressionVariety, icon: "sentiment_satisfied" },
    { label: "안정감", value: 1 - metrics.fidgetingScore, icon: "personal_injury" },
  ];

  return (
    <div className="mb-6 rounded-xl border border-white/8 bg-white/[0.03] p-4">
      <p className="mb-3 text-xs font-semibold text-white/50">비언어 행동 분석 (참고 지표)</p>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs text-white/40">{item.label}</span>
              <span className="text-xs font-semibold text-white/60">
                {Math.round(item.value * 100)}%
              </span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{ width: `${Math.round(item.value * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[10px] text-white/20">
        * 행동 분석 데이터는 브라우저에서만 처리되며 서버에 저장되지 않습니다.
      </p>
    </div>
  );
}
