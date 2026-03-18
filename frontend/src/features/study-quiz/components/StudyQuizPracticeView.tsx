"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  useCreateCsQuizSession,
  useSubmitCsQuizAttempt,
} from "../hooks/useCsQuizMutations";
import type {
  CsQuizAttempt,
  CsQuizDifficulty,
  CsQuizQuestion,
  CsQuizSession,
  CsQuizTopic,
} from "../api/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const TOPICS: { id: CsQuizTopic; label: string; icon: string }[] = [
  { id: "OS", label: "운영체제", icon: "memory" },
  { id: "NETWORK", label: "네트워크", icon: "lan" },
  { id: "DB", label: "데이터베이스", icon: "database" },
  { id: "SPRING", label: "Spring", icon: "eco" },
  { id: "JAVA", label: "Java", icon: "coffee" },
  { id: "DATA_STRUCTURE", label: "자료구조", icon: "account_tree" },
  { id: "ALGORITHM", label: "알고리즘", icon: "functions" },
  { id: "ARCHITECTURE", label: "아키텍처 설계", icon: "architecture" },
  { id: "CLOUD", label: "클라우드 설계", icon: "cloud" },
];

const DIFFICULTIES: { id: CsQuizDifficulty; label: string; color: string }[] = [
  { id: "LOW", label: "하", color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/30" },
  { id: "MID", label: "중", color: "text-amber-600 bg-amber-500/10 border-amber-500/30" },
  { id: "HIGH", label: "상", color: "text-red-600 bg-red-500/10 border-red-500/30" },
];

export function StudyQuizPracticeView() {
  const { user } = useAuth();
  const createSession = useCreateCsQuizSession();
  const submitAttempt = useSubmitCsQuizAttempt();

  const [difficulty, setDifficulty] = useState<CsQuizDifficulty>("MID");
  const [selectedTopics, setSelectedTopics] = useState<CsQuizTopic[]>([
    "OS",
    "DB",
  ]);
  const [questionCount, setQuestionCount] = useState<number>(5);

  const [session, setSession] = useState<CsQuizSession | null>(null);
  const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);
  const [mcqSelectedIndexByQuestion, setMcqSelectedIndexByQuestion] = useState<
    Record<number, number | null>
  >({});
  const [saAnswerByQuestion, setSaAnswerByQuestion] = useState<
    Record<number, string>
  >({});
  const [attemptByQuestion, setAttemptByQuestion] = useState<
    Record<number, CsQuizAttempt | undefined>
  >({});

  const questions = useMemo(() => session?.questions ?? [], [session]);
  const activeQuestion: CsQuizQuestion | null =
    questions.find((q) => q.id === activeQuestionId) ?? (questions[0] ?? null);

  const isBusy = createSession.isPending || submitAttempt.isPending;

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

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      {/* Left panel: Session builder + question list */}
      <aside className="custom-scrollbar lg:col-span-4 lg:pr-2">
        <Card>
          <CardContent className="p-6">
            <div className="mb-6">
              <h3 className="text-base font-bold text-foreground">
                CS 퀴즈 세션 만들기
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                객관식 60% + 주관식 40%로 세션을 생성해요.
              </p>
            </div>

            {createSession.error && (
              <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {createSession.error instanceof Error
                  ? createSession.error.message
                  : "세션 생성 오류"}
              </div>
            )}

            <div className="space-y-5">
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
                        onClick={() => {
                          setSelectedTopics((prev) =>
                            checked
                              ? prev.filter((x) => x !== t.id)
                              : [...prev, t.id]
                          );
                        }}
                        className={cn(
                          "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all text-left",
                          checked
                            ? "border-primary/30 bg-primary/5 text-foreground"
                            : "border-border text-muted-foreground hover:bg-accent"
                        )}
                      >
                        <span className={cn(
                          "material-symbols-outlined text-base",
                          checked ? "text-primary" : "text-muted-foreground"
                        )}>
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
                      Math.max(
                        5,
                        Math.min(10, Number(e.target.value) || 10)
                      )
                    )
                  }
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/20"
                />
              </div>

              <Button
                className="w-full"
                onClick={onCreateSession}
                disabled={!user || selectedTopics.length === 0 || isBusy}
              >
                {createSession.isPending ? "세션 생성 중..." : "세션 생성하기"}
              </Button>
            </div>

            <Separator className="my-6" />

            {/* Question list */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                문제 목록
              </h3>
              {!session ? (
                <p className="text-sm text-muted-foreground">
                  세션을 생성하면 문제가 표시돼요.
                </p>
              ) : (
                <div className="space-y-2">
                  {questions.map((q, idx) => {
                    const isActive = q.id === (activeQuestion?.id ?? null);
                    const attempted = Boolean(attemptByQuestion[q.id]);
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setActiveQuestionId(q.id)}
                        className={cn(
                          "flex w-full items-start justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-all",
                          isActive
                            ? "border-primary/30 bg-primary/5 shadow-sm"
                            : "border-border hover:bg-accent"
                        )}
                      >
                        <div className="flex items-start gap-2 min-w-0">
                          <span className={cn(
                            "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}>
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="text-xs text-muted-foreground">
                              {q.topic} ·{" "}
                              {q.type === "MULTIPLE_CHOICE"
                                ? "객관식"
                                : "주관식"}
                            </div>
                            <div className="truncate text-sm font-medium text-foreground">
                              {q.prompt}
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant={attempted ? "default" : "secondary"}
                          className="shrink-0 text-[10px]"
                        >
                          {attempted ? "완료" : "대기"}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </aside>

      {/* Right panel: Active question */}
      <section className="custom-scrollbar lg:col-span-8">
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  {session ? session.title : "CS 퀴즈"}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {session
                    ? `${session.difficulty} · ${session.topics.join(", ")} · ${questions.length}문항`
                    : "세션을 생성해 시작하세요."}
                </p>
              </div>
            </div>

            {!activeQuestion ? (
              <Card className="border-dashed">
                <CardContent className="p-4 text-sm text-muted-foreground">
                  아직 문제가 없습니다.
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Question prompt */}
                <Card className="border-l-4 border-l-primary bg-muted/20">
                  <CardContent className="p-5">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {activeQuestion.topic}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {activeQuestion.type === "MULTIPLE_CHOICE"
                          ? "객관식"
                          : "주관식"}
                      </Badge>
                    </div>
                    <div className="text-base font-semibold leading-relaxed text-foreground">
                      {activeQuestion.prompt}
                    </div>
                  </CardContent>
                </Card>

                {/* Choices / answer */}
                {activeQuestion.type === "MULTIPLE_CHOICE" ? (
                  <div className="mt-4 space-y-3">
                    {activeQuestion.choices.map((c, idx) => {
                      const selected =
                        mcqSelectedIndexByQuestion[activeQuestion.id] === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() =>
                            setMcqSelectedIndexByQuestion((prev) => ({
                              ...prev,
                              [activeQuestion.id]: idx,
                            }))
                          }
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all",
                            selected
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border hover:bg-accent"
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold",
                              selected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border text-muted-foreground"
                            )}
                          >
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="text-sm font-medium text-foreground">
                            {c}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-4">
                    <Textarea
                      value={saAnswerByQuestion[activeQuestion.id] ?? ""}
                      onChange={(e) =>
                        setSaAnswerByQuestion((prev) => ({
                          ...prev,
                          [activeQuestion.id]: e.target.value,
                        }))
                      }
                      placeholder="답변을 작성해 주세요."
                      rows={6}
                      className="resize-none border-input bg-background"
                    />
                  </div>
                )}

                <div className="mt-4 flex items-center justify-end gap-3">
                  <Button
                    onClick={onSubmit}
                    disabled={
                      !activeQuestion ||
                      submitAttempt.isPending ||
                      (activeQuestion.type === "MULTIPLE_CHOICE" &&
                        typeof mcqSelectedIndexByQuestion[
                          activeQuestion.id
                        ] !== "number") ||
                      (activeQuestion.type === "SHORT_ANSWER" &&
                        !(
                          saAnswerByQuestion[activeQuestion.id] ?? ""
                        ).trim())
                    }
                    className="gap-2 shadow-md shadow-primary/15"
                  >
                    {submitAttempt.isPending
                      ? "제출 중..."
                      : "제출하고 피드백 받기"}
                  </Button>
                </div>

                {/* Feedback */}
                {(submitAttempt.error instanceof Error ||
                  attemptByQuestion[activeQuestion.id]) && (
                  <div className="mt-6">
                    {submitAttempt.error instanceof Error ? (
                      <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                        {submitAttempt.error.message}
                      </div>
                    ) : null}

                    {attemptByQuestion[activeQuestion.id] ? (
                      <FeedbackPanel
                        attempt={
                          attemptByQuestion[
                            activeQuestion.id
                          ] as CsQuizAttempt
                        }
                      />
                    ) : null}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function FeedbackPanel({ attempt }: { attempt: CsQuizAttempt }) {
  return (
    <div className="space-y-4">
      {typeof attempt.correct === "boolean" ? (
        <Card className={cn(
          "border-l-4",
          attempt.correct ? "border-l-emerald-500" : "border-l-red-500"
        )}>
          <CardContent className="p-4">
            <span className={cn(
              "text-sm font-bold",
              attempt.correct ? "text-emerald-600" : "text-red-600"
            )}>
              채점 결과: {attempt.correct ? "정답" : "오답"}
            </span>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-600">
              Strengths
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
              {(attempt.strengths ?? []).map((s, i) => (
                <li key={i}>{s}</li>
              ))}
              {attempt.strengths.length === 0 ? (
                <li className="text-muted-foreground">표시할 내용이 없습니다.</li>
              ) : null}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-600">
              Improvements
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
              {(attempt.improvements ?? []).map((s, i) => (
                <li key={i}>{s}</li>
              ))}
              {attempt.improvements.length === 0 ? (
                <li className="text-muted-foreground">표시할 내용이 없습니다.</li>
              ) : null}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">
            Suggested Answer
          </p>
          <p className="whitespace-pre-wrap text-sm text-foreground">
            {attempt.suggestedAnswer ?? "(없음)"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Follow-ups
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
            {(attempt.followups ?? []).map((s, i) => (
              <li key={i}>{s}</li>
            ))}
            {attempt.followups.length === 0 ? (
              <li className="text-muted-foreground">표시할 내용이 없습니다.</li>
            ) : null}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
