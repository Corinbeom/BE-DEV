"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useResumeFiles } from "@/features/profile/hooks/useResumeFiles";
import type {
  PositionType,
  ResumeFeedback,
  ResumeQuestion,
  ResumeSession,
  SessionReport,
} from "../api/types";
import {
  POSITION_CATEGORIES,
  ALL_POSITIONS,
  TECH_PRESETS,
} from "../constants";
import {
  useCompleteResumeSession,
  useCreateResumeFeedback,
  useCreateResumeSession,
  useGenerateSessionReport,
} from "../hooks/useResumeMutations";
import { useResumeSession } from "../hooks/useResumeSession";
import { AnalysisProgressOverlay } from "./AnalysisProgressOverlay";
import { QuestionSkeleton } from "./QuestionSkeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function ResumePortfolioPrepView() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialSessionId = searchParams.get("sessionId");

  const [positionType, setPositionType] = useState<PositionType>("BE");
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(
    null
  );
  const [portfolioUrl, setPortfolioUrl] = useState<string>("");
  const [targetTechs, setTargetTechs] = useState<string[]>([]);
  const [customTechInput, setCustomTechInput] = useState<string>("");
  const [customPositionInput, setCustomPositionInput] = useState<string>("");
  const [sessionId, setSessionId] = useState<number | null>(
    initialSessionId ? Number(initialSessionId) : null
  );
  const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);
  const [answersByQuestion, setAnswersByQuestion] = useState<
    Record<number, string>
  >({});
  const [feedbackByQuestion, setFeedbackByQuestion] = useState<
    Record<number, ResumeFeedback>
  >({});

  const { data: resumeFiles, isLoading: isLoadingFiles } = useResumeFiles();
  const resumes =
    resumeFiles?.filter(
      (f) => f.fileType === "RESUME" && f.extractStatus === "EXTRACTED"
    ) ?? [];
  const portfolios =
    resumeFiles?.filter(
      (f) => f.fileType === "PORTFOLIO" && f.extractStatus === "EXTRACTED"
    ) ?? [];

  const createSession = useCreateResumeSession();
  const createFeedback = useCreateResumeFeedback();
  const completeSession = useCompleteResumeSession();
  const sessionQuery = useResumeSession(sessionId);

  const session: ResumeSession | null = sessionQuery.data ?? null;
  const questions = useMemo(() => session?.questions ?? [], [session]);

  // 서버에서 받은 세션의 attempts 를 로컬 state 로 1회 복원.
  // 같은 sessionId 에 대해서는 한 번만 실행 (사용자가 새로 입력 중인 답변을 덮어쓰지 않도록).
  const restoredSessionIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (!sessionId) {
      restoredSessionIdRef.current = null;
      return;
    }
    if (restoredSessionIdRef.current === sessionId) return;
    if (questions.length === 0) return;

    const initialAnswers: Record<number, string> = {};
    const initialFeedback: Record<number, ResumeFeedback> = {};
    for (const q of questions) {
      if (q.attempts && q.attempts.length > 0) {
        const latest = q.attempts[q.attempts.length - 1];
        initialAnswers[q.id] = latest.answerText;
        initialFeedback[q.id] = latest;
      }
    }
    setAnswersByQuestion(initialAnswers);
    setFeedbackByQuestion(initialFeedback);
    if (!activeQuestionId && questions[0]) {
      setActiveQuestionId(questions[0].id);
    }
    restoredSessionIdRef.current = sessionId;
  }, [sessionId, questions, activeQuestionId]);

  const activeQuestion = useMemo(() => {
    if (!activeQuestionId) return null;
    return questions.find((q) => q.id === activeQuestionId) ?? null;
  }, [activeQuestionId, questions]);

  const activeAnswer = activeQuestionId
    ? answersByQuestion[activeQuestionId] ?? ""
    : "";
  const activeFeedback = activeQuestionId
    ? feedbackByQuestion[activeQuestionId] ?? null
    : null;

  const attemptedCount = Object.keys(feedbackByQuestion).length;
  const totalCount = questions.length;
  const progressPercent = totalCount > 0 ? (attemptedCount / totalCount) * 100 : 0;
  const isCompleted = session?.status === "COMPLETED";
  const allAnswered = totalCount > 0 && attemptedCount >= totalCount;

  const [showOverlay, setShowOverlay] = useState(false);

  const isBusy =
    createSession.isPending ||
    sessionQuery.isFetching ||
    createFeedback.isPending;

  const hasNoFiles = !isLoadingFiles && resumes.length === 0;

  async function onCreateSession() {
    if (!selectedResumeId) {
      toast.warning("이력서를 먼저 선택해 주세요.");
      return;
    }

    setShowOverlay(true);

    try {
      const created = await createSession.mutateAsync({
        positionType,
        resumeId: selectedResumeId,
        portfolioResumeId: selectedPortfolioId,
        portfolioUrl: portfolioUrl.trim() ? portfolioUrl.trim() : null,
        targetTechnologies: targetTechs.length > 0 ? targetTechs : undefined,
      });

      setSessionId(created.id);
      queryClient.setQueryData(["resumeSession", created.id], created);

      const first = created.questions[0];
      setActiveQuestionId(first?.id ?? null);
      setAnswersByQuestion({});
      setFeedbackByQuestion({});
    } finally {
      setTimeout(() => setShowOverlay(false), 1500);
    }
  }

  async function onCreateFeedback() {
    if (!activeQuestionId) return;
    if (!activeAnswer.trim()) {
      toast.warning("답변을 작성해 주세요.");
      return;
    }

    const fb = await createFeedback.mutateAsync({
      questionId: activeQuestionId,
      answerText: activeAnswer,
    });
    setFeedbackByQuestion((prev) => ({ ...prev, [activeQuestionId]: fb }));

    // 서버 캐시의 attempts 배열을 즉시 갱신하여 카운터가 반영되도록 한다.
    queryClient.setQueryData(
      ["resumeSession", sessionId],
      (old: ResumeSession | undefined) => {
        if (!old) return old;
        return {
          ...old,
          questions: old.questions.map((q) =>
            q.id === activeQuestionId
              ? { ...q, attempts: [...q.attempts, fb] }
              : q
          ),
        };
      }
    );
  }

  function goToNextQuestion() {
    if (!questions.length) return;
    const idx = questions.findIndex((q) => q.id === activeQuestionId);
    if (idx === -1 || idx >= questions.length - 1) {
      // 마지막 질문 — 더 이상 이동하지 않음
      toast.info("마지막 질문입니다. 답변을 마치면 세션을 완료해 주세요.");
      return;
    }
    setActiveQuestionId(questions[idx + 1].id);
  }

  function resetSession() {
    setSessionId(null);
    setActiveQuestionId(null);
    setAnswersByQuestion({});
    setFeedbackByQuestion({});
  }

  async function onCompleteSession() {
    if (!sessionId) return;
    if (isCompleted) return;
    try {
      await completeSession.mutateAsync(sessionId);
      toast.success("세션을 완료했습니다.");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "세션 완료 처리에 실패했습니다."
      );
    }
  }

  // Parse comma-separated keywords string into array
  const activeKeywords = useMemo(() => {
    if (!activeQuestion?.keywords) return [];
    return activeQuestion.keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
  }, [activeQuestion]);

  // ─── Phase 1: Session Setup ───
  if (!session) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-8">
        {/* Hero */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary/10">
            <span className="material-symbols-outlined text-3xl text-primary">
              psychology
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            AI 면접 질문 생성기
          </h1>
          <p className="mt-2 text-muted-foreground">
            이력서와 포트폴리오를 분석해 실제 면접에서 나올 수 있는 질문을
            생성하고,
            <br />
            AI 피드백으로 답변을 개선해 보세요.
          </p>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              icon: "upload_file",
              step: "Step 1",
              title: "이력서 · 포트폴리오 선택",
              desc: "프로필에서 업로드한 파일을 선택하세요.",
              color: "text-blue-600 bg-blue-500/10",
            },
            {
              icon: "auto_awesome",
              step: "Step 2",
              title: "AI 질문 생성",
              desc: "이력서와 포트폴리오를 분석해 맞춤 질문을 만들어요.",
              color: "text-amber-600 bg-amber-500/10",
            },
            {
              icon: "rate_review",
              step: "Step 3",
              title: "답변 연습 · 피드백",
              desc: "답변을 작성하면 AI가 강점과 개선점을 알려줘요.",
              color: "text-emerald-600 bg-emerald-500/10",
            },
          ].map((item) => (
            <Card key={item.step} className="transition-shadow hover:shadow-md">
              <CardContent className="flex flex-col items-center gap-3 p-5 text-center">
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-lg",
                    item.color
                  )}
                >
                  <span className="material-symbols-outlined text-xl">
                    {item.icon}
                  </span>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  {item.step}
                </Badge>
                <h3 className="text-sm font-bold text-foreground">
                  {item.title}
                </h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Setup Form Card */}
        <Card>
          <CardContent className="flex flex-col gap-5 p-6">
            {hasNoFiles ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/30 p-8">
                <span className="material-symbols-outlined text-4xl text-muted-foreground/50">
                  upload_file
                </span>
                <p className="text-center text-sm text-muted-foreground">
                  아직 업로드된 이력서가 없어요.
                </p>
                <Link
                  href="/profile"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
                >
                  프로필에서 업로드하기
                </Link>
              </div>
            ) : (
              <>
                {/* Resume select */}
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    이력서
                  </span>
                  <select
                    className="w-full rounded-lg border border-input bg-background p-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/20"
                    value={selectedResumeId ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setSelectedResumeId(v ? Number(v) : null);
                    }}
                  >
                    <option value="">이력서를 선택하세요</option>
                    {resumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title} ({r.originalFilename})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    <Link
                      href="/profile"
                      className="font-semibold text-primary underline"
                    >
                      프로필 페이지
                    </Link>
                    에서 이력서를 업로드하면 여기에 표시됩니다.
                  </p>
                </label>

                {/* Position chip grid */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    포지션
                  </span>

                  {/* 직접 입력 */}
                  <div className="flex gap-2">
                    <input
                      className="flex-1 rounded-lg border border-input bg-background p-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/20"
                      placeholder="직접 입력 (예: 블록체인 개발자)"
                      value={customPositionInput}
                      onChange={(e) => setCustomPositionInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const val = customPositionInput.trim();
                          if (val) {
                            setPositionType(val.toUpperCase());
                            setTargetTechs([]);
                            setCustomTechInput("");
                            setCustomPositionInput("");
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!customPositionInput.trim()}
                      onClick={() => {
                        const val = customPositionInput.trim();
                        if (val) {
                          setPositionType(val.toUpperCase());
                          setTargetTechs([]);
                          setCustomTechInput("");
                          setCustomPositionInput("");
                        }
                      }}
                    >
                      설정
                    </Button>
                  </div>

                  {/* 카테고리별 칩 그리드 */}
                  {POSITION_CATEGORIES.map((category) => (
                    <div key={category.label} className="flex flex-col gap-1">
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {category.label}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {category.positions.map((pos) => {
                          const isSelected = positionType === pos.id;
                          return (
                            <button
                              key={pos.id}
                              type="button"
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-all",
                                isSelected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                              )}
                              onClick={() => {
                                setPositionType(pos.id);
                                setTargetTechs([]);
                                setCustomTechInput("");
                                setCustomPositionInput("");
                              }}
                            >
                              <span className="material-symbols-outlined text-sm">
                                {pos.icon}
                              </span>
                              {pos.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* 현재 선택된 포지션 표시 */}
                  <p className="text-xs text-muted-foreground">
                    선택됨:{" "}
                    <span className="font-semibold text-foreground">
                      {ALL_POSITIONS.find((p) => p.id === positionType)?.label ?? positionType}
                    </span>
                  </p>
                </div>

                {/* Target Technologies */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    채용공고 기술 스택 (선택)
                  </span>
                  <p className="text-xs text-muted-foreground">
                    채용공고에 명시된 기술을 선택하면 해당 기술 중심의 맞춤 질문이 생성됩니다.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(TECH_PRESETS[positionType] ?? []).map((tech) => {
                      const selected = targetTechs.includes(tech);
                      return (
                        <button
                          key={tech}
                          type="button"
                          className={cn(
                            "rounded-full border px-3 py-1 text-xs font-medium transition-all",
                            selected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                          )}
                          onClick={() =>
                            setTargetTechs((prev) =>
                              selected
                                ? prev.filter((t) => t !== tech)
                                : [...prev, tech]
                            )
                          }
                        >
                          {tech}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 rounded-lg border border-input bg-background p-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/20"
                      placeholder="직접 입력 (예: Elasticsearch)"
                      value={customTechInput}
                      onChange={(e) => setCustomTechInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const val = customTechInput.trim();
                          if (val && !targetTechs.includes(val)) {
                            setTargetTechs((prev) => [...prev, val]);
                          }
                          setCustomTechInput("");
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!customTechInput.trim()}
                      onClick={() => {
                        const val = customTechInput.trim();
                        if (val && !targetTechs.includes(val)) {
                          setTargetTechs((prev) => [...prev, val]);
                        }
                        setCustomTechInput("");
                      }}
                    >
                      추가
                    </Button>
                  </div>
                  {targetTechs.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">선택됨:</span>
                      {targetTechs.map((tech) => (
                        <Badge
                          key={tech}
                          variant="secondary"
                          className="cursor-pointer gap-1 pr-1 text-xs"
                          onClick={() =>
                            setTargetTechs((prev) =>
                              prev.filter((t) => t !== tech)
                            )
                          }
                        >
                          {tech}
                          <span className="material-symbols-outlined text-xs">
                            close
                          </span>
                        </Badge>
                      ))}
                      <button
                        type="button"
                        className="text-xs text-muted-foreground underline hover:text-foreground"
                        onClick={() => setTargetTechs([])}
                      >
                        전체 해제
                      </button>
                    </div>
                  )}
                </div>

                {/* Portfolio URL */}
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    GitHub · Notion · 개인 웹사이트 URL
                  </span>
                  <input
                    className="w-full rounded-lg border border-input bg-background p-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/20"
                    placeholder="https://github.com/username/project"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                  />
                </label>

                {/* Portfolio file */}
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    포트폴리오 파일 (선택)
                  </span>
                  <select
                    className="w-full rounded-lg border border-input bg-background p-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/20"
                    value={selectedPortfolioId ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setSelectedPortfolioId(v ? Number(v) : null);
                    }}
                  >
                    <option value="">선택 안 함</option>
                    {portfolios.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.originalFilename})
                      </option>
                    ))}
                  </select>
                </label>

                {/* CTA */}
                <Button
                  size="lg"
                  className={cn(
                    "mt-2 w-full gap-2",
                    createSession.isPending && "animate-pulse-glow"
                  )}
                  disabled={!user || isBusy || !selectedResumeId}
                  onClick={() => void onCreateSession()}
                >
                  {createSession.isPending ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-sm">
                        progress_activity
                      </span>
                      AI가 질문을 생성하고 있어요...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">
                        analytics
                      </span>
                      질문 생성하기
                    </>
                  )}
                </Button>
                {createSession.error && (
                  <p className="text-sm font-semibold text-destructive">
                    생성 오류:{" "}
                    {createSession.error instanceof Error
                      ? createSession.error.message
                      : String(createSession.error)}
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <AnalysisProgressOverlay
          isActive={showOverlay && createSession.isPending}
          isComplete={showOverlay && !createSession.isPending}
        />
      </div>
    );
  }

  // ─── Phase 2: Practice Session ───
  return (
    <div className="flex flex-col gap-6">
      {/* Session Header with Progress */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-foreground">
            {session.title || "면접 연습"}
          </h2>
          {session.positionType && (
            <Badge variant="secondary">
              {ALL_POSITIONS.find((p) => p.id === session.positionType)?.label ?? session.positionType}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Inline progress */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              <span className="font-bold text-foreground">{attemptedCount}</span>
              {" / "}
              {totalCount} 답변
            </span>
            <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {!isCompleted && (
            <Button
              variant={allAnswered ? "default" : "outline"}
              size="sm"
              disabled={completeSession.isPending}
              onClick={() => void onCompleteSession()}
            >
              <span className="material-symbols-outlined mr-1 text-sm">
                {completeSession.isPending ? "progress_activity" : "task_alt"}
              </span>
              {completeSession.isPending ? "완료 처리 중..." : "세션 완료하기"}
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={resetSession}>
            <span className="material-symbols-outlined mr-1 text-sm">
              add
            </span>
            새 세션
          </Button>
        </div>
      </div>

      {/* Completed view replaces practice grid */}
      {isCompleted && (
        <SessionCompletedView
          session={session}
          attemptedCount={attemptedCount}
          totalCount={totalCount}
          feedbackByQuestion={feedbackByQuestion}
          onResetSession={resetSession}
        />
      )}

      {/* Main: Question Nav + Answer/Feedback */}
      {!isCompleted && (
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Left: Question Navigation */}
        <aside className="xl:col-span-3">
          <div className="custom-scrollbar flex max-h-[calc(100vh-12rem)] flex-col gap-2 overflow-y-auto pr-1">
            {createSession.isPending ||
            (sessionQuery.isFetching && !session) ? (
              <QuestionSkeleton />
            ) : null}

            {questions.map((q, idx) => {
              const hasFeedback = !!feedbackByQuestion[q.id];
              const isActive = q.id === activeQuestionId;
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
                      hasFeedback
                        ? "bg-emerald-500 text-white"
                        : isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    {hasFeedback ? (
                      <span className="material-symbols-outlined text-sm">
                        check
                      </span>
                    ) : (
                      idx + 1
                    )}
                  </div>

                  {/* Badge + truncated text */}
                  <div className="min-w-0 flex-1">
                    <Badge
                      variant={isActive ? "default" : "secondary"}
                      className="mb-0.5 text-[10px]"
                    >
                      {q.badge}
                    </Badge>
                    <p className="truncate text-xs text-muted-foreground">
                      {q.question ?? "(질문 없음)"}
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
                  왼쪽에서 질문을 선택해 주세요.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Question Detail Card */}
              <QuestionDetailCard
                question={activeQuestion}
                keywords={activeKeywords}
              />

              {/* Answer Area */}
              <Card>
                <CardContent className="flex flex-col gap-4 p-5">
                  {(() => {
                    const attemptCount = activeQuestion.attempts.length;
                    const maxAttempts = activeQuestion.maxAttempts;
                    const isAtMax = attemptCount >= maxAttempts;
                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="material-symbols-outlined text-sm">
                              lightbulb
                            </span>
                            팁: STAR 기법(Situation, Task, Action, Result)을 활용해
                            보세요.
                          </div>
                          <span
                            className={cn(
                              "text-xs font-semibold tabular-nums",
                              isAtMax
                                ? "text-destructive"
                                : attemptCount > 0
                                  ? "text-amber-600"
                                  : "text-muted-foreground"
                            )}
                          >
                            답변 횟수 {attemptCount}/{maxAttempts}회
                          </span>
                        </div>

                        {isAtMax ? (
                          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                            <span className="material-symbols-outlined text-base">
                              block
                            </span>
                            최대 답변 횟수({maxAttempts}회)에 도달했습니다. 새 세션을 시작해 주세요.
                          </div>
                        ) : (
                          <Textarea
                            className="min-h-[220px] resize-none border-none bg-muted/30 p-4 text-base leading-relaxed placeholder:text-muted-foreground/50 focus-visible:ring-primary/20"
                            placeholder="여기에 답변을 작성해 보세요..."
                            value={activeAnswer}
                            onChange={(e) => {
                              if (!activeQuestionId) return;
                              const v = e.target.value;
                              setAnswersByQuestion((prev) => ({
                                ...prev,
                                [activeQuestionId]: v,
                              }));
                            }}
                          />
                        )}

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
                            다음 질문
                          </Button>

                          <Button
                            className="gap-2 px-6 shadow-md shadow-primary/15"
                            disabled={!activeQuestionId || isBusy || !activeAnswer.trim() || isAtMax}
                            onClick={() => void onCreateFeedback()}
                          >
                            {createFeedback.isPending ? (
                              <>
                                <span className="material-symbols-outlined animate-spin text-sm">
                                  progress_activity
                                </span>
                                피드백 생성 중...
                              </>
                            ) : (
                              <>
                                <span className="material-symbols-outlined text-sm">
                                  auto_fix_high
                                </span>
                                AI 피드백 받기
                              </>
                            )}
                          </Button>
                        </div>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Feedback loading skeleton */}
              {createFeedback.isPending && (
                <FeedbackSkeleton />
              )}

              {/* Feedback — inline, no tabs */}
              {activeFeedback && !createFeedback.isPending && (
                <FeedbackPanel
                  feedback={activeFeedback}
                  modelAnswer={activeQuestion.modelAnswer}
                  userAnswer={activeAnswer}
                />
              )}
            </>
          )}
        </main>
      </div>
      )}

      <AnalysisProgressOverlay
        isActive={showOverlay && createSession.isPending}
        isComplete={showOverlay && !createSession.isPending}
      />
    </div>
  );
}

// ─── Question Detail Card ───
function QuestionDetailCard({
  question,
  keywords,
}: {
  question: ResumeQuestion;
  keywords: string[];
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="outline" className="text-[10px]">
            {question.badge}
          </Badge>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="material-symbols-outlined text-xs">
              trending_up
            </span>
            출제 확률 {question.likelihood}%
          </span>
        </div>

        <p className="text-lg font-bold leading-snug text-foreground">
          {question.question ?? "(질문 내용이 비어있습니다)"}
        </p>

        {/* Intention */}
        {question.intention && (
          <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
            <span className="material-symbols-outlined mt-0.5 text-sm text-primary">
              visibility
            </span>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">
                출제 의도
              </p>
              <p className="text-sm text-foreground">{question.intention}</p>
            </div>
          </div>
        )}

        {/* Keywords */}
        {keywords.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-muted-foreground">
              sell
            </span>
            {keywords.map((kw) => (
              <Badge key={kw} variant="secondary" className="text-[11px]">
                {kw}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Feedback Skeleton (loading state) ───
const FEEDBACK_MESSAGES = [
  "답변을 분석하고 있어요",
  "핵심 키워드를 확인하고 있어요",
  "개선점을 찾고 있어요",
  "모범 답변을 생성하고 있어요",
];

function FeedbackSkeleton() {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % FEEDBACK_MESSAGES.length);
    }, 5_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="overflow-hidden">
      <div className="h-1 w-full bg-muted">
        <div className="animate-progress-indeterminate h-full bg-primary" />
      </div>
      <CardContent className="flex flex-col items-center gap-3 p-8">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
          <span className="material-symbols-outlined animate-spin text-2xl text-primary">
            progress_activity
          </span>
        </div>
        <p className="text-sm font-medium text-foreground">
          {FEEDBACK_MESSAGES[msgIdx]}...
        </p>
        <p className="text-xs text-muted-foreground">
          AI가 꼼꼼하게 평가하고 있습니다
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Feedback Panel (all-in-one, no tabs) ───
function FeedbackPanel({
  feedback,
  modelAnswer,
  userAnswer,
}: {
  feedback: ResumeFeedback;
  modelAnswer: string | null;
  userAnswer: string;
}) {
  const [showModelAnswer, setShowModelAnswer] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {/* 잘한 점 / 개선할 점 — 나란히 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-emerald-500">
                thumb_up
              </span>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                잘한 점
              </p>
            </div>
            <ul className="space-y-2 text-sm text-foreground">
              {feedback.strengths.length > 0 ? (
                feedback.strengths.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="material-symbols-outlined mt-0.5 text-sm text-emerald-500">
                      check_circle
                    </span>
                    <span>{s}</span>
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
            <div className="mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-amber-500">
                tips_and_updates
              </span>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-600">
                개선할 점
              </p>
            </div>
            <ul className="space-y-2 text-sm text-foreground">
              {feedback.improvements.length > 0 ? (
                feedback.improvements.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="material-symbols-outlined mt-0.5 text-sm text-amber-500">
                      arrow_upward
                    </span>
                    <span>{s}</span>
                  </li>
                ))
              ) : (
                <li className="text-muted-foreground">항목이 없습니다.</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* AI 개선 예시 답변 */}
      {feedback.suggestedAnswer && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-primary">
                auto_fix_high
              </span>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                AI 개선 예시 답변
              </p>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
              {feedback.suggestedAnswer}
            </p>
          </CardContent>
        </Card>
      )}

      {/* 모범 답변 비교 — 토글 */}
      {modelAnswer && (
        <Card>
          <CardContent className="p-4">
            <button
              type="button"
              className="flex w-full items-center justify-between"
              onClick={() => setShowModelAnswer((v) => !v)}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-primary">
                  compare
                </span>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  내 답변 vs 모범 답변
                </p>
              </div>
              <span
                className={cn(
                  "material-symbols-outlined text-sm text-muted-foreground transition-transform",
                  showModelAnswer && "rotate-180"
                )}
              >
                expand_more
              </span>
            </button>

            {showModelAnswer && (
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-lg bg-muted/30 p-3">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    내 답변
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                    {userAnswer || "(작성한 답변이 없습니다)"}
                  </p>
                </div>
                <div className="rounded-lg bg-primary/5 p-3">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-primary">
                    모범 답변
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                    {modelAnswer}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 후속 질문 */}
      {feedback.followups.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-primary">
                forum
              </span>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                예상 후속 질문
              </p>
              <Badge variant="secondary" className="text-[10px]">
                {feedback.followups.length}
              </Badge>
            </div>
            <ul className="space-y-2">
              {feedback.followups.map((fq, idx) => (
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
      )}
    </div>
  );
}

// ─── Session Completed View ───
function SessionCompletedView({
  session,
  attemptedCount,
  totalCount,
  feedbackByQuestion,
  onResetSession,
}: {
  session: ResumeSession;
  attemptedCount: number;
  totalCount: number;
  feedbackByQuestion: Record<number, ResumeFeedback>;
  onResetSession: () => void;
}) {
  const feedbacks = Object.values(feedbackByQuestion);
  const totalStrengths = feedbacks.reduce((sum, f) => sum + f.strengths.length, 0);
  const totalImprovements = feedbacks.reduce(
    (sum, f) => sum + f.improvements.length,
    0
  );
  const avgStrengths =
    feedbacks.length > 0
      ? Math.round((totalStrengths / feedbacks.length) * 10) / 10
      : 0;
  const avgImprovements =
    feedbacks.length > 0
      ? Math.round((totalImprovements / feedbacks.length) * 10) / 10
      : 0;

  const completedAtLabel = session.completedAt
    ? new Date(session.completedAt).toLocaleString("ko-KR")
    : null;

  const generateReport = useGenerateSessionReport();
  const reportRequestedRef = useRef(false);

  useEffect(() => {
    if (reportRequestedRef.current) return;
    if (!session.id) return;
    reportRequestedRef.current = true;
    generateReport.mutate(session.id);
  }, [session.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const report = generateReport.data ?? null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      {/* Hero */}
      <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <span className="material-symbols-outlined text-4xl">task_alt</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              면접 세션을 완료했습니다
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              수고하셨어요. 이번 세션의 결과를 정리했습니다.
            </p>
            {completedAtLabel && (
              <p className="mt-1 text-xs text-muted-foreground">
                완료 시각: {completedAtLabel}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardContent className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
          <StatTile
            icon="quiz"
            label="답변한 질문"
            value={`${attemptedCount} / ${totalCount}`}
            tone="primary"
          />
          <StatTile
            icon="thumb_up"
            label="평균 강점 수"
            value={avgStrengths.toString()}
            tone="emerald"
          />
          <StatTile
            icon="tips_and_updates"
            label="평균 개선점 수"
            value={avgImprovements.toString()}
            tone="amber"
          />
        </CardContent>
      </Card>

      {/* AI 회고 리포트 */}
      {generateReport.isPending ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-8">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
              <span className="material-symbols-outlined animate-spin text-2xl text-primary">
                progress_activity
              </span>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">
                AI 회고 리포트 생성 중...
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                세션 데이터를 분석하고 있습니다. 잠시만 기다려 주세요.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : generateReport.isError ? (
        <Card className="border-destructive/30">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <span className="material-symbols-outlined">error</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">
                리포트 생성에 실패했습니다
              </p>
              <p className="text-xs text-muted-foreground">
                {generateReport.error instanceof Error
                  ? generateReport.error.message
                  : "알 수 없는 오류"}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                generateReport.mutate(session.id);
              }}
            >
              재시도
            </Button>
          </CardContent>
        </Card>
      ) : report ? (
        <SessionReportCard report={report} />
      ) : null}

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/resume-analyzer">
          <Button variant="outline" size="lg">
            <span className="material-symbols-outlined mr-1 text-sm">
              arrow_back
            </span>
            세션 목록으로
          </Button>
        </Link>
        <Link href="/resume-analyzer/report">
          <Button variant="outline" size="lg">
            <span className="material-symbols-outlined mr-1 text-sm">
              analytics
            </span>
            누적 리포트 보기
          </Button>
        </Link>
        <Button size="lg" onClick={onResetSession}>
          <span className="material-symbols-outlined mr-1 text-sm">add</span>
          새 세션 시작
        </Button>
      </div>
    </div>
  );
}

// ─── Session Report Card ───
function SessionReportCard({ report }: { report: SessionReport }) {
  const scoreColor =
    report.overallScore >= 8
      ? "text-emerald-600 dark:text-emerald-400"
      : report.overallScore >= 5
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";

  return (
    <div className="space-y-4">
      {/* Header + Score */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <span className="material-symbols-outlined">auto_awesome</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-foreground">
                  AI 회고 리포트
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">종합 점수</span>
                  <span className={cn("text-2xl font-bold", scoreColor)}>
                    {report.overallScore}
                  </span>
                  <span className="text-xs text-muted-foreground">/10</span>
                </div>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {report.executiveSummary}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badge Summaries */}
      {report.badgeSummaries.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">
                category
              </span>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                유형별 분석
              </p>
            </div>
            <div className="space-y-4">
              {report.badgeSummaries.map((bs) => (
                <div key={bs.badge} className="rounded-lg border border-border/60 p-3">
                  <Badge variant="secondary" className="mb-2 text-[10px]">
                    {bs.badge}
                  </Badge>
                  <p className="text-sm text-muted-foreground">{bs.summary}</p>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {bs.strengths.length > 0 && (
                      <div>
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          강점
                        </p>
                        <ul className="space-y-1">
                          {bs.strengths.map((s, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-xs text-foreground">
                              <span className="mt-0.5 text-emerald-500">•</span>
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {bs.weaknesses.length > 0 && (
                      <div>
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                          약점
                        </p>
                        <ul className="space-y-1">
                          {bs.weaknesses.map((w, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-xs text-foreground">
                              <span className="mt-0.5 text-amber-500">•</span>
                              {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Repeated Gaps */}
      {report.repeatedGaps.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-destructive">
                warning
              </span>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                반복 역량 갭
              </p>
            </div>
            <ul className="space-y-2">
              {report.repeatedGaps.map((gap, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-lg bg-destructive/5 p-3"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-xs font-bold text-destructive">
                    {i + 1}
                  </span>
                  <p className="text-sm text-foreground">{gap}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Top Improvements */}
      {report.topImprovements.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">
                trending_up
              </span>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Top 3 개선 포인트
              </p>
            </div>
            <div className="space-y-3">
              {report.topImprovements.map((imp, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {imp.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {imp.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Closing Advice */}
      <Card className="border-emerald-200/50 bg-emerald-50/30 dark:border-emerald-900/30 dark:bg-emerald-950/10">
        <CardContent className="flex items-start gap-3 p-5">
          <span className="material-symbols-outlined mt-0.5 text-emerald-600 dark:text-emerald-400">
            lightbulb
          </span>
          <p className="text-sm leading-relaxed text-foreground">
            {report.closingAdvice}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: string;
  label: string;
  value: string;
  tone: "primary" | "emerald" | "amber";
}) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
      : tone === "amber"
        ? "text-amber-600 dark:text-amber-400 bg-amber-500/10"
        : "text-primary bg-primary/10";

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg",
          toneClass
        )}
      >
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="text-lg font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}
