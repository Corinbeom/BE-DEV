"use client";

import { useMemo, useState } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
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

  // Load session from URL param for re-entry
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

  const attemptedCount = Object.values(attemptByQuestion).filter(Boolean).length;
  const totalCount = questions.length;
  const progressPercent = totalCount > 0 ? (attemptedCount / totalCount) * 100 : 0;

  const isBusy = createSession.isPending || submitAttempt.isPending || loadedSessionQuery.isFetching;

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

  function goToNextQuestion() {
    if (!questions.length) return;
    const idx = questions.findIndex((q) => q.id === activeQuestionId);
    const next = questions[(idx + 1) % questions.length];
    setActiveQuestionId(next.id);
  }

  function resetSession() {
    setSession(null);
    setActiveQuestionId(null);
    setMcqSelectedIndexByQuestion({});
    setSaAnswerByQuestion({});
    setAttemptByQuestion({});
  }

  // ─── Phase 1: Session Setup ───
  if (!effectiveSession) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-8">
        {/* Hero */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary/10">
            <span className="material-symbols-outlined text-3xl text-primary">
              school
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">CS 퀴즈</h1>
          <p className="mt-2 text-muted-foreground">
            객관식 60% + 주관식 40%로 CS 지식을 점검하고,
            <br />
            AI 피드백으로 부족한 부분을 보완하세요.
          </p>
        </div>

        {/* Setup Form Card */}
        <Card>
          <CardContent className="flex flex-col gap-5 p-6">
            {createSession.error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {createSession.error instanceof Error
                  ? createSession.error.message
                  : "세션 생성 오류"}
              </div>
            )}

            {/* Difficulty */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                난이도
              </p>
              <div className="flex gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDifficulty(d.id)}
                    className={cn(
                      "flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition-all",
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

            {/* Topics */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                토픽 (복수 선택)
              </p>
              <div className="grid grid-cols-2 gap-2">
                {TOPICS.map((t) => {
                  const checked = selectedTopics.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() =>
                        setSelectedTopics((prev) =>
                          checked
                            ? prev.filter((x) => x !== t.id)
                            : [...prev, t.id]
                        )
                      }
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all text-left",
                        checked
                          ? "border-primary/30 bg-primary/5 text-foreground"
                          : "border-border text-muted-foreground hover:bg-accent"
                      )}
                    >
                      <span
                        className={cn(
                          "material-symbols-outlined text-base",
                          checked ? "text-primary" : "text-muted-foreground"
                        )}
                      >
                        {t.icon}
                      </span>
                      {t.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                최소 1개 이상 선택해 주세요.
              </p>
            </div>

            {/* Question count */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                문항 수 (5~10)
              </p>
              <input
                type="number"
                min={5}
                max={10}
                value={questionCount}
                onChange={(e) =>
                  setQuestionCount(
                    Math.max(5, Math.min(10, Number(e.target.value) || 10))
                  )
                }
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/20"
              />
            </div>

            {/* CTA */}
            <Button
              size="lg"
              className={cn(
                "mt-2 w-full gap-2",
                createSession.isPending && "animate-pulse-glow"
              )}
              disabled={!user || selectedTopics.length === 0 || isBusy}
              onClick={() => void onCreateSession()}
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
                  <span className="material-symbols-outlined text-sm">
                    play_arrow
                  </span>
                  세션 생성하기
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Phase 2: Practice Session ───
  const diffMeta = DIFFICULTY_META[effectiveSession.difficulty];
  const activeAttempt = activeQuestion
    ? attemptByQuestion[activeQuestion.id]
    : undefined;

  return (
    <div className="flex flex-col gap-6">
      {/* Session Header with Progress */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-foreground">
            {effectiveSession.title || "CS 퀴즈"}
          </h2>
          {diffMeta && (
            <Badge
              variant="outline"
              className={cn("text-xs font-semibold", diffMeta.color)}
            >
              난이도: {diffMeta.label}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Inline progress */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              <span className="font-bold text-foreground">{attemptedCount}</span>
              {" / "}
              {totalCount} 완료
            </span>
            <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={resetSession}>
            <span className="material-symbols-outlined mr-1 text-sm">add</span>
            새 세션
          </Button>
        </div>
      </div>

      {/* Main: Question Nav + Answer/Feedback */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Left: Question Navigation */}
        <aside className="xl:col-span-3">
          <div className="custom-scrollbar flex max-h-[calc(100vh-12rem)] flex-col gap-2 overflow-y-auto pr-1">
            {questions.map((q, idx) => {
              const attempt = attemptByQuestion[q.id];
              const isActive = q.id === (activeQuestion?.id ?? null);

              // Determine indicator state
              let indicatorClass = "bg-muted text-muted-foreground";
              let indicatorContent: React.ReactNode = idx + 1;

              if (attempt) {
                if (q.type === "MULTIPLE_CHOICE") {
                  if (attempt.correct) {
                    indicatorClass = "bg-emerald-500 text-white";
                    indicatorContent = (
                      <span className="material-symbols-outlined text-sm">
                        check
                      </span>
                    );
                  } else {
                    indicatorClass = "bg-red-500 text-white";
                    indicatorContent = (
                      <span className="material-symbols-outlined text-sm">
                        close
                      </span>
                    );
                  }
                } else {
                  indicatorClass = "bg-primary text-primary-foreground";
                  indicatorContent = (
                    <span className="material-symbols-outlined text-sm">
                      check
                    </span>
                  );
                }
              } else if (isActive) {
                indicatorClass = "bg-primary text-primary-foreground";
              }

              return (
                <button
                  key={q.id}
                  type="button"
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all",
                    isActive
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-transparent hover:border-border hover:bg-muted/50"
                  )}
                  onClick={() => setActiveQuestionId(q.id)}
                >
                  {/* Number circle */}
                  <div
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      indicatorClass
                    )}
                  >
                    {indicatorContent}
                  </div>

                  {/* Topic + type + truncated prompt */}
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-center gap-1">
                      <Badge
                        variant={isActive ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {TOPIC_LABEL[q.topic] ?? q.topic}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {q.type === "MULTIPLE_CHOICE" ? "객관식" : "주관식"}
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {q.prompt}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right: Question Detail + Answer + Feedback */}
        <main className="flex flex-col gap-5 xl:col-span-9">
          {!activeQuestion ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center gap-2 p-12 text-center">
                <span className="material-symbols-outlined text-4xl text-muted-foreground/40">
                  quiz
                </span>
                <p className="text-muted-foreground">
                  왼쪽에서 문제를 선택해 주세요.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Question Card */}
              <Card>
                <CardContent className="flex flex-col gap-3 p-5">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {TOPIC_LABEL[activeQuestion.topic] ?? activeQuestion.topic}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {activeQuestion.type === "MULTIPLE_CHOICE"
                        ? "객관식"
                        : "주관식"}
                    </Badge>
                  </div>
                  <p className="text-lg font-bold leading-snug text-foreground">
                    {activeQuestion.prompt}
                  </p>
                </CardContent>
              </Card>

              {/* Answer Area */}
              <Card>
                <CardContent className="flex flex-col gap-4 p-5">
                  {activeQuestion.type === "MULTIPLE_CHOICE" ? (
                    <div className="space-y-3">
                      {activeQuestion.choices.map((c, idx) => {
                        const selected =
                          mcqSelectedIndexByQuestion[activeQuestion.id] === idx;
                        const hasAttempt = !!activeAttempt;

                        // Post-submit visual feedback
                        let choiceStyle =
                          "border-border hover:bg-accent";
                        if (selected && !hasAttempt) {
                          choiceStyle =
                            "border-primary bg-primary/5 shadow-sm";
                        } else if (hasAttempt && selected) {
                          choiceStyle = activeAttempt.correct
                            ? "border-emerald-500 bg-emerald-500/10"
                            : "border-red-500 bg-red-500/10";
                        }

                        let circleStyle =
                          "border-border text-muted-foreground";
                        if (selected && !hasAttempt) {
                          circleStyle =
                            "border-primary bg-primary text-primary-foreground";
                        } else if (hasAttempt && selected) {
                          circleStyle = activeAttempt.correct
                            ? "border-emerald-500 bg-emerald-500 text-white"
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
                              hasAttempt
                                ? "cursor-default"
                                : "cursor-pointer",
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
                            <span className="text-sm font-medium text-foreground">
                              {c}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="material-symbols-outlined text-sm">
                          lightbulb
                        </span>
                        팁: 핵심 개념을 먼저 언급하고, 예시를 들어 설명해 보세요.
                      </div>
                      <Textarea
                        className="min-h-[180px] resize-none border-none bg-muted/30 p-4 text-base leading-relaxed placeholder:text-muted-foreground/50 focus-visible:ring-primary/20"
                        placeholder="답변을 작성해 주세요."
                        value={saAnswerByQuestion[activeQuestion.id] ?? ""}
                        onChange={(e) =>
                          setSaAnswerByQuestion((prev) => ({
                            ...prev,
                            [activeQuestion.id]: e.target.value,
                          }))
                        }
                      />
                    </>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!questions.length}
                      onClick={goToNextQuestion}
                    >
                      <span className="material-symbols-outlined mr-1 text-sm">
                        navigate_next
                      </span>
                      다음 문제
                    </Button>

                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-xs font-semibold tabular-nums",
                            activeAttempt ? "text-amber-600" : "text-muted-foreground"
                          )}
                        >
                          답변 횟수 {activeAttempt ? 1 : 0}/3회
                        </span>
                        <Button
                          className="gap-2 px-6 shadow-md shadow-primary/15"
                          disabled={
                            !activeQuestion ||
                            submitAttempt.isPending ||
                            !!activeAttempt ||
                            (activeQuestion.type === "MULTIPLE_CHOICE" &&
                              typeof mcqSelectedIndexByQuestion[
                                activeQuestion.id
                              ] !== "number") ||
                            (activeQuestion.type === "SHORT_ANSWER" &&
                              !(
                                saAnswerByQuestion[activeQuestion.id] ?? ""
                              ).trim())
                          }
                          onClick={() => void onSubmit()}
                        >
                          {submitAttempt.isPending ? (
                            <>
                              <span className="material-symbols-outlined animate-spin text-sm">
                                progress_activity
                              </span>
                              채점 중...
                            </>
                          ) : activeAttempt ? (
                            <>
                              <span className="material-symbols-outlined text-sm">
                                check_circle
                              </span>
                              제출 완료
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-sm">
                                send
                              </span>
                              제출하고 피드백 받기
                            </>
                          )}
                        </Button>
                      </div>
                      {submitAttempt.isPending && (
                        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                          <div className="animate-progress-indeterminate h-full rounded-full bg-primary" />
                        </div>
                      )}
                    </div>
                  </div>

                  {submitAttempt.error && (
                    <p className="text-sm font-semibold text-destructive">
                      제출 오류:{" "}
                      {submitAttempt.error instanceof Error
                        ? submitAttempt.error.message
                        : String(submitAttempt.error)}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Feedback Tabs — only when attempt exists */}
              {activeAttempt && (
                <FeedbackTabs attempt={activeAttempt} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

// ─── Feedback Tabs ───
function FeedbackTabs({ attempt }: { attempt: CsQuizAttempt }) {
  return (
    <Tabs defaultValue="evaluation">
      <TabsList>
        <TabsTrigger value="evaluation">
          <span className="material-symbols-outlined mr-1 text-sm">
            check_circle
          </span>
          AI 평가
        </TabsTrigger>
        <TabsTrigger value="suggested-answer">
          <span className="material-symbols-outlined mr-1 text-sm">
            auto_awesome
          </span>
          모범 답변
        </TabsTrigger>
        {attempt.followups.length > 0 && (
          <TabsTrigger value="followups">
            <span className="material-symbols-outlined mr-1 text-sm">
              forum
            </span>
            후속 질문
            <Badge variant="secondary" className="ml-1 text-[10px]">
              {attempt.followups.length}
            </Badge>
          </TabsTrigger>
        )}
      </TabsList>

      {/* Tab 1: AI Evaluation */}
      <TabsContent value="evaluation">
        {/* Correct/Incorrect banner */}
        {typeof attempt.correct === "boolean" && (
          <Card
            className={cn(
              "mb-4 border-l-4",
              attempt.correct ? "border-l-emerald-500" : "border-l-red-500"
            )}
          >
            <CardContent className="flex items-center gap-2 p-4">
              <span
                className={cn(
                  "material-symbols-outlined text-lg",
                  attempt.correct ? "text-emerald-600" : "text-red-600"
                )}
              >
                {attempt.correct ? "check_circle" : "cancel"}
              </span>
              <span
                className={cn(
                  "text-sm font-bold",
                  attempt.correct ? "text-emerald-600" : "text-red-600"
                )}
              >
                채점 결과: {attempt.correct ? "정답" : "오답"}
              </span>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-600">
                잘한 점
              </p>
              <ul className="space-y-2 text-sm text-foreground">
                {attempt.strengths.length > 0 ? (
                  attempt.strengths.map((s, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-sm text-emerald-500">
                        done
                      </span>
                      {s}
                    </li>
                  ))
                ) : (
                  <li className="text-muted-foreground">항목이 없습니다.</li>
                )}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-4">
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
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Tab 2: Suggested Answer */}
      <TabsContent value="suggested-answer">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">
              모범 답변
            </p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {attempt.suggestedAnswer ?? "(모범 답변이 제공되지 않았습니다)"}
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab 3: Follow-ups */}
      {attempt.followups.length > 0 && (
        <TabsContent value="followups">
          <Card>
            <CardContent className="p-4">
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
            </CardContent>
          </Card>
        </TabsContent>
      )}
    </Tabs>
  );
}
