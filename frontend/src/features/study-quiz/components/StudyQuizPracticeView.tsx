"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  useCreateCsQuizSession,
  useSubmitCsQuizAttempt,
} from "../hooks/useCsQuizMutations";
import { useCsQuizSession } from "../hooks/useCsQuizSession";
import type {
  CsQuizAttempt,
  CsQuizDifficulty,
  CsQuizQuestion,
  CsQuizSession,
  CsQuizTopic,
} from "../api/types";
import { TOPICS, DIFFICULTIES, TOPIC_LABEL, DIFFICULTY_META } from "../constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export function StudyQuizPracticeView() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialSessionId = searchParams.get("sessionId");
  const createSession = useCreateCsQuizSession();
  const submitAttempt = useSubmitCsQuizAttempt();

  const [difficulty, setDifficulty] = useState<CsQuizDifficulty>("MID");
  const [selectedTopics, setSelectedTopics] = useState<CsQuizTopic[]>(["OS", "DB"]);
  const [questionCount, setQuestionCount] = useState<number>(5);

  const [session, setSession] = useState<CsQuizSession | null>(null);
  const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);

  const loadedSessionQuery = useCsQuizSession(
    !session && initialSessionId ? Number(initialSessionId) : null
  );
  const effectiveSession = session ?? loadedSessionQuery.data ?? null;

  const [mcqSelectedIndexByQuestion, setMcqSelectedIndexByQuestion] = useState<
    Record<number, number | null>
  >({});
  const [saAnswerByQuestion, setSaAnswerByQuestion] = useState<
    Record<number, string>
  >({});
  const [attemptByQuestion, setAttemptByQuestion] = useState<
    Record<number, CsQuizAttempt | undefined>
  >({});

  const questions = useMemo(() => effectiveSession?.questions ?? [], [effectiveSession]);
  const activeQuestion: CsQuizQuestion | null =
    questions.find((q) => q.id === activeQuestionId) ?? (questions[0] ?? null);
  const activeIndex = questions.findIndex((q) => q.id === activeQuestion?.id);

  const attemptedCount = Object.values(attemptByQuestion).filter(Boolean).length;
  const totalCount = questions.length;
  const progressPercent = totalCount > 0 ? (attemptedCount / totalCount) * 100 : 0;

  const isBusy =
    createSession.isPending || submitAttempt.isPending || loadedSessionQuery.isFetching;

  async function onCreateSession() {
    const created = await createSession.mutateAsync({
      difficulty,
      topics: selectedTopics,
      questionCount,
      title: `CS Quiz (${difficulty})`,
    });
    setSession(created);
    setActiveQuestionId(created.questions[0]?.id ?? null);
    setMcqSelectedIndexByQuestion({});
    setSaAnswerByQuestion({});
    setAttemptByQuestion({});
  }

  async function onSubmit() {
    if (!activeQuestion) return;
    const q = activeQuestion;

    if (q.type === "MULTIPLE_CHOICE") {
      const selected = mcqSelectedIndexByQuestion[q.id];
      if (typeof selected !== "number") return;
      const attempt = await submitAttempt.mutateAsync({
        questionId: q.id,
        selectedChoiceIndex: selected,
      });
      setAttemptByQuestion((prev) => ({ ...prev, [q.id]: attempt }));
      return;
    }

    const answer = (saAnswerByQuestion[q.id] ?? "").trim();
    if (!answer) return;
    const attempt = await submitAttempt.mutateAsync({
      questionId: q.id,
      answerText: answer,
    });
    setAttemptByQuestion((prev) => ({ ...prev, [q.id]: attempt }));
  }

  function goToQuestion(delta: number) {
    if (!questions.length) return;
    const idx = questions.findIndex((q) => q.id === activeQuestion?.id);
    const nextIdx = Math.max(0, Math.min(questions.length - 1, idx + delta));
    setActiveQuestionId(questions[nextIdx].id);
  }

  function resetSession() {
    setSession(null);
    setActiveQuestionId(null);
    setMcqSelectedIndexByQuestion({});
    setSaAnswerByQuestion({});
    setAttemptByQuestion({});
  }

  // ─── Loading (URL 복원 중) ───
  if (!effectiveSession && loadedSessionQuery.isFetching) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 pt-20">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">
          progress_activity
        </span>
        <p className="text-sm text-muted-foreground">세션을 불러오는 중...</p>
      </div>
    );
  }

  // ─── Phase 1: 세션 설정 ───
  if (!effectiveSession) {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        {/* Hero */}
        <div>
          <h1 className="text-[22px] font-bold text-foreground">CS 퀴즈</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            객관식 60% + 주관식 40%로 CS 지식을 점검하고 AI 피드백을 받아보세요.
          </p>
        </div>

        {/* Setup Form */}
        <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-6">
          {createSession.error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {createSession.error instanceof Error
                ? createSession.error.message
                : "세션 생성 오류"}
            </div>
          )}

          {/* 난이도 */}
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              난이도
            </p>
            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDifficulty(d.id)}
                  className={cn(
                    "flex-1 rounded-full border px-3 py-2 text-sm font-semibold transition-all",
                    d.id === difficulty
                      ? d.color
                      : "border-border text-muted-foreground hover:bg-accent"
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* 토픽 */}
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              토픽{" "}
              <span className="text-[10px] font-normal normal-case text-muted-foreground/70">
                복수 선택
              </span>
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {TOPICS.map((t) => {
                const checked = selectedTopics.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() =>
                      setSelectedTopics((prev) =>
                        checked ? prev.filter((x) => x !== t.id) : [...prev, t.id]
                      )
                    }
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-medium transition-all",
                      checked
                        ? "border-primary/30 bg-primary/5 text-foreground"
                        : "border-border text-muted-foreground hover:bg-accent"
                    )}
                  >
                    <span
                      className={cn(
                        "material-symbols-outlined shrink-0 text-base",
                        checked ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {t.icon}
                    </span>
                    <span className="truncate">{t.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">최소 1개 이상 선택해 주세요.</p>
          </div>

          {/* 문항 수 */}
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              문항 수
            </p>
            <div className="flex gap-2">
              {[5, 6, 7, 8, 9, 10].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setQuestionCount(n)}
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-all",
                    n === questionCount
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:bg-accent"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button
            type="button"
            disabled={!user || selectedTopics.length === 0 || isBusy}
            onClick={() => void onCreateSession()}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
          >
            {createSession.isPending ? (
              <>
                <span className="material-symbols-outlined animate-spin text-sm">
                  progress_activity
                </span>
                AI가 문제를 생성하고 있어요...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">school</span>
                세션 생성하기
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ─── Phase 2: 연습 세션 ───
  const diffMeta = DIFFICULTY_META[effectiveSession.difficulty];
  const activeAttempt = activeQuestion ? attemptByQuestion[activeQuestion.id] : undefined;

  return (
    <div className="-mx-6 -mt-6 flex min-h-[calc(100vh-3rem)]">
      {/* ── LEFT nav ── */}
      <div className="hidden md:flex w-[220px] shrink-0 flex-col bg-card border-r border-border sticky top-0 max-h-[calc(100vh-3rem)] overflow-hidden">
        {/* 헤더 */}
        <div className="flex flex-col gap-2 border-b border-border px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground truncate">
            {effectiveSession.title || "CS 퀴즈"}
          </p>
          {diffMeta && (
            <span
              className={cn(
                "w-fit rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                diffMeta.color
              )}
            >
              {diffMeta.label}
            </span>
          )}
          <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            <span className="font-semibold text-foreground">{attemptedCount}</span> /{" "}
            {totalCount} 완료
          </p>
        </div>

        {/* 질문 목록 */}
        <div className="flex-1 overflow-y-auto p-2">
          {questions.map((q, idx) => {
            const attempt = attemptByQuestion[q.id];
            const isActive = q.id === (activeQuestion?.id ?? null);

            let circleClass = "bg-border text-muted-foreground";
            let circleContent: React.ReactNode = (
              <span className="text-[10px] font-bold">{idx + 1}</span>
            );

            if (attempt) {
              if (q.type === "MULTIPLE_CHOICE") {
                circleClass = attempt.correct
                  ? "bg-[oklch(0.52_0.18_150)] text-white"
                  : "bg-red-500 text-white";
                circleContent = (
                  <span className="material-symbols-outlined text-[12px]">
                    {attempt.correct ? "check" : "close"}
                  </span>
                );
              } else {
                circleClass = "bg-primary text-primary-foreground";
                circleContent = (
                  <span className="material-symbols-outlined text-[12px]">check</span>
                );
              }
            } else if (isActive) {
              circleClass = "bg-primary text-primary-foreground";
            }

            return (
              <button
                key={q.id}
                type="button"
                className={cn(
                  "flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors",
                  isActive ? "bg-primary/10" : "hover:bg-muted/50"
                )}
                onClick={() => setActiveQuestionId(q.id)}
              >
                <div
                  className={cn(
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                    circleClass
                  )}
                >
                  {circleContent}
                </div>
                <div className="min-w-0">
                  <span
                    className={cn(
                      "block text-[11px] font-semibold",
                      attempt
                        ? q.type === "MULTIPLE_CHOICE"
                          ? attempt.correct
                            ? "text-[oklch(0.52_0.18_150)]"
                            : "text-red-500"
                          : "text-primary"
                        : isActive
                          ? "text-primary"
                          : "text-muted-foreground"
                    )}
                  >
                    {TOPIC_LABEL[q.topic] ?? q.topic} ·{" "}
                    {q.type === "MULTIPLE_CHOICE" ? "객관식" : "주관식"}
                  </span>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{q.prompt}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* 푸터 */}
        <div className="flex flex-col gap-2 border-t border-border px-3 py-3">
          <button
            type="button"
            onClick={resetSession}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            새 세션 시작
          </button>
          <Link
            href="/study-quiz"
            className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            세션 목록
          </Link>
        </div>
      </div>

      {/* ── CENTER ── */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {!activeQuestion ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-muted-foreground/40">
              quiz
            </span>
            <p className="text-muted-foreground">왼쪽에서 문제를 선택해 주세요.</p>
          </div>
        ) : (
          <>
            {/* 질문 헤더 */}
            <div className="border-b border-border bg-card px-6 py-5">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
                  {TOPIC_LABEL[activeQuestion.topic] ?? activeQuestion.topic}
                </span>
                <span className="rounded-full bg-muted px-3 py-0.5 text-xs font-semibold text-muted-foreground">
                  {activeQuestion.type === "MULTIPLE_CHOICE" ? "객관식" : "주관식"}
                </span>
                <span className="ml-auto font-mono text-[11px] text-muted-foreground">
                  Q {activeIndex + 1} / {totalCount}
                </span>
              </div>
              <p className="text-[17px] font-semibold leading-relaxed text-foreground">
                {activeQuestion.prompt}
              </p>
            </div>

            {/* 답변 영역 */}
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
              {activeQuestion.type === "MULTIPLE_CHOICE" ? (
                <div className="flex flex-col gap-3">
                  {activeQuestion.choices.map((c, idx) => {
                    const selected =
                      mcqSelectedIndexByQuestion[activeQuestion.id] === idx;
                    const hasAttempt = !!activeAttempt;

                    let choiceStyle = "border-border hover:bg-accent";
                    let circleStyle = "border-border text-muted-foreground";

                    if (selected && !hasAttempt) {
                      choiceStyle = "border-primary bg-primary/5";
                      circleStyle = "border-primary bg-primary text-primary-foreground";
                    } else if (hasAttempt && selected) {
                      choiceStyle = activeAttempt.correct
                        ? "border-[oklch(0.52_0.18_150)] bg-[oklch(0.52_0.18_150)]/10"
                        : "border-red-500 bg-red-500/10";
                      circleStyle = activeAttempt.correct
                        ? "border-[oklch(0.52_0.18_150)] bg-[oklch(0.52_0.18_150)] text-white"
                        : "border-red-500 bg-red-500 text-white";
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={hasAttempt}
                        onClick={() =>
                          setMcqSelectedIndexByQuestion((prev) => ({
                            ...prev,
                            [activeQuestion.id]: idx,
                          }))
                        }
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all",
                          hasAttempt ? "cursor-default" : "cursor-pointer",
                          choiceStyle
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold",
                            circleStyle
                          )}
                        >
                          {hasAttempt && selected ? (
                            <span className="material-symbols-outlined text-sm">
                              {activeAttempt.correct ? "check" : "close"}
                            </span>
                          ) : (
                            String.fromCharCode(65 + idx)
                          )}
                        </span>
                        <span className="text-sm font-medium text-foreground">{c}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <span className="text-[13px] font-semibold text-foreground">내 답변</span>
                  <Textarea
                    className="min-h-[200px] resize-none border border-primary/25 p-4 text-[15px] leading-relaxed placeholder:text-muted-foreground/50 focus-visible:ring-primary/20 disabled:cursor-default disabled:opacity-70"
                    placeholder="답변을 작성해 주세요."
                    disabled={!!activeAttempt}
                    value={saAnswerByQuestion[activeQuestion.id] ?? ""}
                    onChange={(e) =>
                      setSaAnswerByQuestion((prev) => ({
                        ...prev,
                        [activeQuestion.id]: e.target.value,
                      }))
                    }
                  />
                </div>
              )}

              {/* 인라인 피드백 */}
              {activeAttempt && (
                <div className="rounded-xl border border-border bg-card p-5">
                  <FeedbackTabs attempt={activeAttempt} />
                </div>
              )}

              {submitAttempt.error && (
                <p className="text-sm font-semibold text-destructive">
                  제출 오류:{" "}
                  {submitAttempt.error instanceof Error
                    ? submitAttempt.error.message
                    : String(submitAttempt.error)}
                </p>
              )}
            </div>

            {/* 액션바 */}
            <div className="flex items-center justify-between border-t border-border bg-card px-6 py-3.5">
              <button
                type="button"
                disabled={activeIndex <= 0}
                onClick={() => goToQuestion(-1)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                이전
              </button>

              <div className="flex items-center gap-3">
                {submitAttempt.isPending && (
                  <div className="h-1 w-24 overflow-hidden rounded-full bg-muted">
                    <div className="animate-progress-indeterminate h-full rounded-full bg-primary" />
                  </div>
                )}

                {activeAttempt ? (
                  <button
                    type="button"
                    disabled={activeIndex >= totalCount - 1}
                    onClick={() => goToQuestion(1)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
                  >
                    다음
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={
                      submitAttempt.isPending ||
                      (activeQuestion.type === "MULTIPLE_CHOICE" &&
                        typeof mcqSelectedIndexByQuestion[activeQuestion.id] !== "number") ||
                      (activeQuestion.type === "SHORT_ANSWER" &&
                        !(saAnswerByQuestion[activeQuestion.id] ?? "").trim())
                    }
                    onClick={() => void onSubmit()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
                  >
                    {submitAttempt.isPending ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-sm">
                          progress_activity
                        </span>
                        채점 중...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">send</span>
                        제출하고 피드백 받기
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── RIGHT metadata ── */}
      {activeQuestion && (
        <div className="hidden 2xl:flex w-[240px] shrink-0 flex-col bg-card border-l border-border sticky top-0 max-h-[calc(100vh-3rem)] overflow-y-auto">
          <div className="border-b border-border px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              문제 정보
            </p>
          </div>
          <div className="flex flex-col gap-5 px-4 py-4">
            {/* 토픽 */}
            <div>
              <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                토픽
              </p>
              <span className="inline-block rounded-lg bg-primary/10 px-3 py-1.5 text-[13px] font-semibold text-primary">
                {TOPIC_LABEL[activeQuestion.topic] ?? activeQuestion.topic}
              </span>
            </div>

            {/* 난이도 */}
            {diffMeta && (
              <div>
                <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  난이도
                </p>
                <span
                  className={cn(
                    "inline-block rounded-lg border px-3 py-1.5 text-[13px] font-semibold",
                    diffMeta.color
                  )}
                >
                  {diffMeta.label}
                </span>
              </div>
            )}

            {/* 유형 */}
            <div>
              <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                유형
              </p>
              <span className="text-[13px] text-muted-foreground">
                {activeQuestion.type === "MULTIPLE_CHOICE"
                  ? "객관식 (Multiple Choice)"
                  : "주관식 (Short Answer)"}
              </span>
            </div>

            {/* 팁 (주관식) */}
            {activeQuestion.type === "SHORT_ANSWER" && (
              <div className="rounded-lg border border-border bg-background p-3.5">
                <div className="mb-1.5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-amber-500">
                    lightbulb
                  </span>
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    답변 팁
                  </span>
                </div>
                <p className="text-[12px] leading-relaxed text-muted-foreground">
                  핵심 개념을 먼저 언급하고, 예시를 들어 설명해 보세요.
                </p>
              </div>
            )}

            {/* 세션 현황 */}
            <div>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                세션 현황
              </p>
              <div className="flex flex-wrap gap-1.5">
                {questions.map((q, idx) => {
                  const attempt = attemptByQuestion[q.id];
                  const isActive = q.id === activeQuestion.id;
                  let dotClass = "bg-muted text-muted-foreground";
                  if (attempt) {
                    if (q.type === "MULTIPLE_CHOICE") {
                      dotClass = attempt.correct
                        ? "bg-[oklch(0.52_0.18_150)] text-white"
                        : "bg-red-500 text-white";
                    } else {
                      dotClass = "bg-primary text-primary-foreground";
                    }
                  } else if (isActive) {
                    dotClass = "bg-primary/30 text-primary";
                  }
                  return (
                    <button
                      key={q.id}
                      title={`Q${idx + 1}`}
                      onClick={() => setActiveQuestionId(q.id)}
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full text-[10px] font-bold transition-all",
                        dotClass,
                        isActive ? "ring-2 ring-primary ring-offset-1" : ""
                      )}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Feedback Tabs ───
function FeedbackTabs({ attempt }: { attempt: CsQuizAttempt }) {
  return (
    <Tabs defaultValue="evaluation">
      <TabsList>
        <TabsTrigger value="evaluation">
          <span className="material-symbols-outlined mr-1 text-sm">check_circle</span>
          AI 평가
        </TabsTrigger>
        <TabsTrigger value="suggested-answer">
          <span className="material-symbols-outlined mr-1 text-sm">auto_awesome</span>
          모범 답변
        </TabsTrigger>
        {attempt.followups.length > 0 && (
          <TabsTrigger value="followups">
            <span className="material-symbols-outlined mr-1 text-sm">forum</span>
            후속 질문
            <Badge variant="secondary" className="ml-1 text-[10px]">
              {attempt.followups.length}
            </Badge>
          </TabsTrigger>
        )}
      </TabsList>

      {/* AI 평가 */}
      <TabsContent value="evaluation">
        {typeof attempt.correct === "boolean" && (
          <div
            className={cn(
              "mb-4 flex items-center gap-2 rounded-xl border p-4",
              attempt.correct
                ? "border-[oklch(0.52_0.18_150)]/30 bg-[oklch(0.52_0.18_150)]/5"
                : "border-red-500/30 bg-red-500/5"
            )}
          >
            <span
              className={cn(
                "material-symbols-outlined text-lg",
                attempt.correct ? "text-[oklch(0.52_0.18_150)]" : "text-red-600"
              )}
            >
              {attempt.correct ? "check_circle" : "cancel"}
            </span>
            <span
              className={cn(
                "text-sm font-bold",
                attempt.correct ? "text-[oklch(0.52_0.18_150)]" : "text-red-600"
              )}
            >
              채점 결과: {attempt.correct ? "정답" : "오답"}
            </span>
          </div>
        )}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[oklch(0.52_0.18_150)]">
              잘한 점
            </p>
            <ul className="space-y-2 text-sm text-foreground">
              {attempt.strengths.length > 0 ? (
                attempt.strengths.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm text-[oklch(0.52_0.18_150)]">
                      done
                    </span>
                    {s}
                  </li>
                ))
              ) : (
                <li className="text-muted-foreground">항목이 없습니다.</li>
              )}
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-600">
              개선할 점
            </p>
            <ul className="space-y-2 text-sm text-foreground">
              {attempt.improvements.length > 0 ? (
                attempt.improvements.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm text-amber-500">
                      info
                    </span>
                    {s}
                  </li>
                ))
              ) : (
                <li className="text-muted-foreground">항목이 없습니다.</li>
              )}
            </ul>
          </div>
        </div>
      </TabsContent>

      {/* 모범 답변 */}
      <TabsContent value="suggested-answer">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">
            모범 답변
          </p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {attempt.suggestedAnswer ?? "(모범 답변이 제공되지 않았습니다)"}
          </p>
        </div>
      </TabsContent>

      {/* 후속 질문 */}
      {attempt.followups.length > 0 && (
        <TabsContent value="followups">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              예상 후속 질문
            </p>
            <ul className="space-y-3">
              {attempt.followups.map((fq, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 rounded-lg bg-muted/50 p-3"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {idx + 1}
                  </span>
                  <p className="text-sm text-foreground">{fq}</p>
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>
      )}
    </Tabs>
  );
}
