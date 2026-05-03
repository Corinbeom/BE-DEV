"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useSpeechInterview } from "../hooks/useSpeechInterviews";
import type { SpeechInterviewSession, SpeechInterviewQuestion, BehavioralMetricsDto, SpeechFeedback } from "../api/types";
import { cn } from "@/lib/utils";

// ── 행동 분석 평균 계산 ─────────────────────────────────────

function avgMetrics(session: SpeechInterviewSession): BehavioralMetricsDto | null {
  const metricsArr = session.questions
    .map((q) => q.answer?.behavioralMetrics)
    .filter((m): m is BehavioralMetricsDto => m != null);
  if (metricsArr.length === 0) return null;
  return {
    eyeContactRatio: metricsArr.reduce((s, m) => s + m.eyeContactRatio, 0) / metricsArr.length,
    postureStability: metricsArr.reduce((s, m) => s + m.postureStability, 0) / metricsArr.length,
    expressionVariety: metricsArr.reduce((s, m) => s + m.expressionVariety, 0) / metricsArr.length,
    fidgetingScore: metricsArr.reduce((s, m) => s + m.fidgetingScore, 0) / metricsArr.length,
  };
}

function hasPendingFeedback(session: SpeechInterviewSession): boolean {
  return session.questions.some((q) => q.answer?.feedbackStatus === "PENDING");
}

// ── 행동 지표 바 ───────────────────────────────────────────

function MetricBar({
  label,
  value,
  icon,
  thresholdGood,
  thresholdWarn,
  invert = false,
}: {
  label: string;
  value: number;
  icon: string;
  thresholdGood: number;
  thresholdWarn: number;
  invert?: boolean;
}) {
  const displayValue = invert ? 1 - value : value;
  const color =
    displayValue >= thresholdGood
      ? "text-green-400"
      : displayValue >= thresholdWarn
      ? "text-amber-400"
      : "text-red-400";
  const barColor =
    displayValue >= thresholdGood
      ? "bg-green-500"
      : displayValue >= thresholdWarn
      ? "bg-amber-500"
      : "bg-red-500";

  return (
    <div className="flex items-center gap-3">
      <div className="flex w-20 shrink-0 items-center gap-1.5">
        <span className={cn("material-symbols-outlined text-sm", color)}>{icon}</span>
        <span className={cn("text-xs font-semibold", color)}>{label}</span>
      </div>
      <div className="flex flex-1 items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className={cn("h-full rounded-full transition-all duration-500", barColor)}
            style={{ width: `${Math.round(displayValue * 100)}%` }}
          />
        </div>
        <span className={cn("w-9 text-right text-xs font-bold tabular-nums", color)}>
          {Math.round(displayValue * 100)}%
        </span>
      </div>
    </div>
  );
}

// ── 피드백 태그 리스트 ────────────────────────────────────

function FeedbackList({ items, variant }: { items: string[]; variant: "good" | "improve" }) {
  if (!items || items.length === 0) return null;
  const dotCls = variant === "good" ? "bg-green-400" : "bg-amber-400";
  const textCls = variant === "good" ? "text-green-300/80" : "text-amber-300/80";
  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", dotCls)} />
          <span className={cn("text-xs leading-relaxed", textCls)}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

// ── 질문 카드 ─────────────────────────────────────────────

function QuestionCard({ question, index }: { question: SpeechInterviewQuestion; index: number }) {
  const answer = question.answer;
  const feedback = answer?.feedback as SpeechFeedback | undefined;
  const isPending = answer?.feedbackStatus === "PENDING";
  const isCompleted = answer?.feedbackStatus === "COMPLETED";
  const noAnswer = !answer;

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
      {/* 질문 헤더 */}
      <div className="border-b border-white/6 px-5 py-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] font-semibold text-white/40">
            Q{index + 1}
          </span>
          <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-300">
            {question.badge}
          </span>
        </div>
        <p className="text-sm font-medium leading-relaxed text-white/85">
          {question.questionText}
        </p>
      </div>

      {/* 답변 + 피드백 */}
      <div className="px-5 py-4 space-y-4">
        {noAnswer ? (
          <p className="text-xs text-white/25 italic">답변 없음</p>
        ) : (
          <>
            {/* 내 답변 */}
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/25">
                내 답변
              </p>
              <p className="text-sm leading-relaxed text-white/60">
                {answer.answerText === "(답변 없음)" ? (
                  <span className="italic text-white/25">답변 없음</span>
                ) : (
                  answer.answerText
                )}
              </p>
            </div>

            {/* 피드백 섹션 */}
            {isPending && (
              <div className="flex items-center gap-2 rounded-xl border border-blue-500/15 bg-blue-500/[0.04] px-4 py-3">
                <span className="material-symbols-outlined animate-spin text-sm text-blue-400">progress_activity</span>
                <span className="text-xs text-blue-300/70">AI가 답변을 분석하고 있습니다...</span>
              </div>
            )}

            {isCompleted && feedback && (
              <div className="space-y-3">
                {/* 강점 */}
                {feedback.strengths && feedback.strengths.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-green-400/60">강점</p>
                    <FeedbackList items={feedback.strengths} variant="good" />
                  </div>
                )}

                {/* 개선점 */}
                {feedback.improvements && feedback.improvements.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400/60">개선점</p>
                    <FeedbackList items={feedback.improvements} variant="improve" />
                  </div>
                )}

                {/* 전달력 */}
                {((feedback.deliveryStrengths && feedback.deliveryStrengths.length > 0) ||
                  (feedback.deliveryImprovements && feedback.deliveryImprovements.length > 0)) && (
                  <div className="rounded-xl border border-blue-500/10 bg-blue-500/[0.03] p-3 space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-300/50">
                      전달력 (비언어)
                    </p>
                    {feedback.deliveryStrengths && <FeedbackList items={feedback.deliveryStrengths} variant="good" />}
                    {feedback.deliveryImprovements && <FeedbackList items={feedback.deliveryImprovements} variant="improve" />}
                  </div>
                )}

                {/* 모범 답변 */}
                {feedback.suggestedAnswer && (
                  <details className="group">
                    <summary className="cursor-pointer list-none">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/25 hover:text-white/40 transition-colors">
                        <span className="material-symbols-outlined text-xs transition-transform group-open:rotate-90">chevron_right</span>
                        모범 답변 보기
                      </div>
                    </summary>
                    <p className="mt-2 text-xs leading-relaxed text-white/40 pl-4 border-l border-white/8">
                      {feedback.suggestedAnswer}
                    </p>
                  </details>
                )}

                {/* 꼬리 질문 */}
                {feedback.followups && feedback.followups.length > 0 && (
                  <details className="group">
                    <summary className="cursor-pointer list-none">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/25 hover:text-white/40 transition-colors">
                        <span className="material-symbols-outlined text-xs transition-transform group-open:rotate-90">chevron_right</span>
                        예상 꼬리 질문 ({feedback.followups.length})
                      </div>
                    </summary>
                    <ul className="mt-2 space-y-1 pl-4 border-l border-white/8">
                      {feedback.followups.map((q, i) => (
                        <li key={i} className="text-xs text-white/40 leading-relaxed">
                          • {q}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            )}

            {answer.feedbackStatus === "FAILED" && (
              <p className="text-xs text-red-400/60 italic">피드백 생성에 실패했습니다.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ────────────────────────────────────────

function ResultContent({ session }: { session: SpeechInterviewSession }) {
  const router = useRouter();
  const answeredCount = session.questions.filter((q) => q.answer).length;
  const totalCount = session.questions.length;
  const participationRate = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;
  const metrics = session.useCamera ? avgMetrics(session) : null;

  return (
    <div className="min-h-screen bg-[#0a1628]">
      <div className="pointer-events-none fixed -right-32 -top-32 size-[500px] rounded-full bg-blue-600/5 blur-3xl" />

      {/* 헤더 */}
      <header className="sticky top-0 z-10 border-b border-white/5 bg-[#0a1628]/90 backdrop-blur-md">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-blue-400">record_voice_over</span>
            <span className="text-sm font-semibold text-white/80">스피치 면접 결과</span>
          </div>
          <button
            onClick={() => router.push("/resume-analyzer")}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/50 hover:bg-white/10 hover:text-white/80 transition-all"
          >
            ← 돌아가기
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8 space-y-6">
        {/* 세션 타이틀 */}
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  session.status === "COMPLETED"
                    ? "bg-green-500/10 text-green-400"
                    : "bg-blue-500/10 text-blue-400"
                )}>
                  {session.status === "COMPLETED" ? "완료" : "진행 중"}
                </span>
                {session.useCamera && (
                  <span className="flex items-center gap-1 rounded-full bg-blue-500/8 px-2 py-0.5 text-xs text-blue-300/70">
                    <span className="material-symbols-outlined text-xs">videocam</span>
                    행동 분석
                  </span>
                )}
              </div>
              <h1 className="text-lg font-bold text-white">{session.title}</h1>
              {session.positionType && (
                <p className="mt-1 text-sm text-white/40">{session.positionType}</p>
              )}
            </div>
          </div>

          {/* 통계 */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              { label: "전체 질문", value: totalCount, icon: "help_outline" },
              { label: "답변 완료", value: answeredCount, icon: "check_circle", highlight: true },
              { label: "참여율", value: `${participationRate}%`, icon: "percent" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center justify-center rounded-xl border border-white/6 bg-white/[0.02] py-3 gap-1"
              >
                <span className={cn(
                  "material-symbols-outlined text-base",
                  stat.highlight ? "text-green-400" : "text-white/30"
                )}>{stat.icon}</span>
                <span className={cn(
                  "text-lg font-bold tabular-nums",
                  stat.highlight ? "text-green-400" : "text-white"
                )}>{stat.value}</span>
                <span className="text-[10px] text-white/30">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 비언어 행동 분석 패널 */}
        {metrics && (
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-white/80">
              <span className="material-symbols-outlined text-sm text-blue-400">monitoring</span>
              비언어 행동 분석
              <span className="ml-auto text-[10px] font-normal text-white/25">전체 답변 평균</span>
            </h2>

            <div className="space-y-3">
              <MetricBar
                label="시선 안정성"
                value={metrics.eyeContactRatio}
                icon="visibility"
                thresholdGood={0.65}
                thresholdWarn={0.45}
              />
              <MetricBar
                label="자세 안정성"
                value={metrics.postureStability}
                icon="self_improvement"
                thresholdGood={0.7}
                thresholdWarn={0.5}
              />
              <MetricBar
                label="표정 다양성"
                value={metrics.expressionVariety}
                icon="sentiment_satisfied"
                thresholdGood={0.4}
                thresholdWarn={0.2}
              />
              <MetricBar
                label="안정감"
                value={metrics.fidgetingScore}
                icon="personal_injury"
                thresholdGood={0.6}
                thresholdWarn={0.4}
                invert
              />
            </div>

            {/* 전달력 AI 피드백 (첫 번째 완료된 답변에서 추출) */}
            {(() => {
              const deliveryFeedback = session.questions
                .map((q) => q.answer?.feedback)
                .find((f) => f && ((f.deliveryStrengths && f.deliveryStrengths.length > 0) || (f.deliveryImprovements && f.deliveryImprovements.length > 0)));
              if (!deliveryFeedback) return null;
              return (
                <div className="mt-4 border-t border-white/6 pt-4 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-white/30">AI 전달력 종합 피드백</p>
                  {deliveryFeedback.deliveryStrengths && <FeedbackList items={deliveryFeedback.deliveryStrengths} variant="good" />}
                  {deliveryFeedback.deliveryImprovements && <FeedbackList items={deliveryFeedback.deliveryImprovements} variant="improve" />}
                </div>
              );
            })()}
          </div>
        )}

        {/* 질문별 상세 분석 */}
        <div>
          <h2 className="mb-3 text-sm font-bold text-white/60 uppercase tracking-wider">
            질문별 상세 분석
          </h2>
          <div className="space-y-3">
            {session.questions.map((q, i) => (
              <QuestionCard key={q.id} question={q} index={i} />
            ))}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-3 pb-8">
          <button
            onClick={() => router.push("/speech-interview")}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white/60 hover:bg-white/10 hover:text-white/80 transition-all"
          >
            다시 시작
          </button>
          <button
            onClick={() => router.push("/resume-analyzer")}
            className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition-all"
          >
            AI 면접 준비로 돌아가기
          </button>
        </div>
      </main>
    </div>
  );
}

export function SpeechInterviewResultPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const parsedId = sessionId ? parseInt(sessionId, 10) : null;

  const { data: session, isLoading, error } = useSpeechInterview(
    parsedId,
    // 피드백 PENDING인 답변이 있으면 polling 활성화 (data가 로드된 후에만 판단)
    false // 초기값은 false, 아래 컴포넌트에서 동적으로 처리
  );

  // polling 여부를 session 데이터 기반으로 결정
  const pendingExists = session ? hasPendingFeedback(session) : false;
  const { data: polledSession } = useSpeechInterview(parsedId, pendingExists);

  const displaySession = polledSession ?? session;

  if (!parsedId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a1628]">
        <p className="text-sm text-white/40">잘못된 접근입니다.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#0a1628]">
        <span className="material-symbols-outlined animate-spin text-2xl text-blue-400">progress_activity</span>
        <p className="text-sm text-white/40">결과를 불러오는 중...</p>
      </div>
    );
  }

  if (error || !displaySession) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#0a1628]">
        <span className="material-symbols-outlined text-2xl text-red-400">error</span>
        <p className="text-sm text-white/40">결과를 불러오지 못했습니다.</p>
      </div>
    );
  }

  return <ResultContent session={displaySession} />;
}
