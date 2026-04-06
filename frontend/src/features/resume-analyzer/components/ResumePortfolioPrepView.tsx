"use client";

import { useMemo, useState } from "react";
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
} from "../api/types";
import {
  POSITION_CATEGORIES,
  ALL_POSITIONS,
  TECH_PRESETS,
} from "../constants";
import {
  useCreateResumeFeedback,
  useCreateResumeSession,
} from "../hooks/useResumeMutations";
import { useResumeSession } from "../hooks/useResumeSession";
import { AnalysisProgressOverlay } from "./AnalysisProgressOverlay";
import { QuestionSkeleton } from "./QuestionSkeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  const sessionQuery = useResumeSession(sessionId);

  const session: ResumeSession | null = sessionQuery.data ?? null;
  const questions = useMemo(() => session?.questions ?? [], [session]);

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
  }

  function goToNextQuestion() {
    if (!questions.length) return;
    const idx = questions.findIndex((q) => q.id === activeQuestionId);
    const next = questions[(idx + 1) % questions.length];
    setActiveQuestionId(next.id);
  }

  function resetSession() {
    setSessionId(null);
    setActiveQuestionId(null);
    setAnswersByQuestion({});
    setFeedbackByQuestion({});
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
            <span className="material-symbols-outlined mr-1 text-sm">
              add
            </span>
            새 세션
          </Button>
        </div>
      </div>

      {/* Main: Question Nav + Answer/Feedback */}
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
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="material-symbols-outlined text-sm">
                      lightbulb
                    </span>
                    팁: STAR 기법(Situation, Task, Action, Result)을 활용해
                    보세요.
                  </div>

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

                    <div className="flex flex-col items-end gap-1">
                      <Button
                        className="gap-2 px-6 shadow-md shadow-primary/15"
                        disabled={!activeQuestionId || isBusy}
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
                      {createFeedback.isPending && (
                        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                          <div className="animate-progress-indeterminate h-full rounded-full bg-primary" />
                        </div>
                      )}
                    </div>
                  </div>

                  {createFeedback.error && (
                    <p className="text-sm font-semibold text-destructive">
                      피드백 오류:{" "}
                      {createFeedback.error instanceof Error
                        ? createFeedback.error.message
                        : String(createFeedback.error)}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Feedback Tabs — only when feedback exists */}
              {activeFeedback && (
                <FeedbackTabs
                  feedback={activeFeedback}
                  modelAnswer={activeQuestion.modelAnswer}
                  userAnswer={activeAnswer}
                />
              )}
            </>
          )}
        </main>
      </div>

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

// ─── Feedback Tabs ───
function FeedbackTabs({
  feedback,
  modelAnswer,
  userAnswer,
}: {
  feedback: ResumeFeedback;
  modelAnswer: string | null;
  userAnswer: string;
}) {
  return (
    <Tabs defaultValue="evaluation">
      <TabsList>
        <TabsTrigger value="evaluation">
          <span className="material-symbols-outlined mr-1 text-sm">
            check_circle
          </span>
          AI 평가
        </TabsTrigger>
        <TabsTrigger value="model-answer">
          <span className="material-symbols-outlined mr-1 text-sm">
            auto_awesome
          </span>
          모범 답변
        </TabsTrigger>
        {feedback.followups.length > 0 && (
          <TabsTrigger value="followups">
            <span className="material-symbols-outlined mr-1 text-sm">
              forum
            </span>
            후속 질문
            <Badge variant="secondary" className="ml-1 text-[10px]">
              {feedback.followups.length}
            </Badge>
          </TabsTrigger>
        )}
      </TabsList>

      {/* Tab 1: AI Evaluation */}
      <TabsContent value="evaluation">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-600">
                잘한 점
              </p>
              <ul className="space-y-2 text-sm text-foreground">
                {feedback.strengths.length > 0 ? (
                  feedback.strengths.map((s, idx) => (
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
                {feedback.improvements.length > 0 ? (
                  feedback.improvements.map((s, idx) => (
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

        {/* Suggested Answer */}
        {feedback.suggestedAnswer && (
          <Card className="mt-4 border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">
                AI 개선 예시 답변
              </p>
              <p className="text-sm italic leading-relaxed text-foreground/80">
                {feedback.suggestedAnswer}
              </p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Tab 2: Model Answer */}
      <TabsContent value="model-answer">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* My answer */}
          <Card>
            <CardContent className="p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                내 답변
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {userAnswer || "(작성한 답변이 없습니다)"}
              </p>
            </CardContent>
          </Card>

          {/* Model answer */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">
                모범 답변
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {modelAnswer || "(모범 답변이 제공되지 않았습니다)"}
              </p>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Tab 3: Follow-ups */}
      {feedback.followups.length > 0 && (
        <TabsContent value="followups">
          <Card>
            <CardContent className="p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                예상 후속 질문
              </p>
              <ul className="space-y-3">
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
        </TabsContent>
      )}
    </Tabs>
  );
}
