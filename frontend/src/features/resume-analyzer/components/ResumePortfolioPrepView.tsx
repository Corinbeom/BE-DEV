"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useResumeFiles } from "@/features/profile/hooks/useResumeFiles";
import type { ResumeFile } from "@/features/profile/api/types";
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
} from "../hooks/useResumeMutations";
import { useResumeSession, useSessionReport } from "../hooks/useResumeSession";
import { AnalysisProgressOverlay } from "./AnalysisProgressOverlay";
import { QuestionSkeleton } from "./QuestionSkeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function ResumePortfolioPrepView() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialSessionId = searchParams.get("sessionId");

  const [positionType, setPositionType] = useState<PositionType>("BE");
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(null);
  const [targetTechs, setTargetTechs] = useState<string[]>([]);
  const [customTechInput, setCustomTechInput] = useState<string>("");
  const [customPositionInput, setCustomPositionInput] = useState<string>("");
  const [sessionId, setSessionId] = useState<number | null>(
    initialSessionId ? Number(initialSessionId) : null
  );
  const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);
  const [answersByQuestion, setAnswersByQuestion] = useState<Record<number, string>>({});
  const [feedbackByQuestion, setFeedbackByQuestion] = useState<Record<number, ResumeFeedback>>({});

  // "How it works" collapse (localStorage)
  const [showGuide, setShowGuide] = useState(() => {
    if (typeof window !== "undefined") {
      return !localStorage.getItem("resume-prep-guide-dismissed");
    }
    return true;
  });

  const { data: resumeFiles, isLoading: isLoadingFiles } = useResumeFiles();
  const resumes =
    resumeFiles?.filter((f) => f.fileType === "RESUME" && f.extractStatus === "EXTRACTED") ?? [];
  const portfolios =
    resumeFiles?.filter((f) => f.fileType === "PORTFOLIO" && f.extractStatus === "EXTRACTED") ?? [];

  const createSession = useCreateResumeSession();
  const createFeedback = useCreateResumeFeedback();
  const completeSession = useCompleteResumeSession();
  const sessionQuery = useResumeSession(sessionId);

  const session: ResumeSession | null = sessionQuery.data ?? null;
  const questions = useMemo(() => session?.questions ?? [], [session]);

  // ref로 최신 feedbackByQuestion 참조
  const feedbackByQuestionRef = useRef(feedbackByQuestion);
  feedbackByQuestionRef.current = feedbackByQuestion;

  // 서버 세션 복원
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

  const activeAnswer = activeQuestionId ? answersByQuestion[activeQuestionId] ?? "" : "";
  const activeFeedback = activeQuestionId ? feedbackByQuestion[activeQuestionId] ?? null : null;

  const attemptedCount = Object.keys(feedbackByQuestion).length;
  const totalCount = questions.length;
  const progressPercent = totalCount > 0 ? (attemptedCount / totalCount) * 100 : 0;
  const isCompleted = session?.status === "COMPLETED";
  const allAnswered = totalCount > 0 && attemptedCount >= totalCount;

  const [showOverlay, setShowOverlay] = useState(false);

  const isBusy = createSession.isPending || sessionQuery.isFetching || createFeedback.isPending;
  const hasNoFiles = !isLoadingFiles && resumes.length === 0;

  const activeKeywords = useMemo(() => {
    if (!activeQuestion?.keywords) return [];
    return activeQuestion.keywords.split(",").map((k) => k.trim()).filter(Boolean);
  }, [activeQuestion]);

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
        portfolioUrl: null,
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

    queryClient.setQueryData(
      ["resumeSession", sessionId],
      (old: ResumeSession | undefined) => {
        if (!old) return old;
        return {
          ...old,
          questions: old.questions.map((q) =>
            q.id === activeQuestionId ? { ...q, attempts: [...q.attempts, fb] } : q
          ),
        };
      }
    );
  }

  function goToNextQuestion() {
    if (!questions.length) return;
    const idx = questions.findIndex((q) => q.id === activeQuestionId);
    if (idx === -1 || idx >= questions.length - 1) {
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
      toast.error(e instanceof Error ? e.message : "세션 완료 처리에 실패했습니다.");
    }
  }

  // ─── Phase 1: Session Setup ───
  if (!session) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        {/* Hero — 좌측 정렬 (Pulse E1) */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            AI 면접 준비
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            이력서를 분석해 실제 면접 질문과 AI 피드백을 받아보세요.
          </p>
        </div>

        {/* How it works — Pulse E2 */}
        {showGuide ? (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                {
                  icon: "upload_file",
                  step: "01",
                  title: "이력서 · 포트폴리오 선택",
                  desc: "프로필에서 업로드한 파일을 선택하세요.",
                },
                {
                  icon: "auto_awesome",
                  step: "02",
                  title: "AI 질문 생성",
                  desc: "이력서와 포트폴리오를 분석해 맞춤 질문을 만들어요.",
                },
                {
                  icon: "rate_review",
                  step: "03",
                  title: "답변 연습 · 피드백",
                  desc: "답변을 작성하면 AI가 강점과 개선점을 알려줘요.",
                },
              ].map((item) => (
                <Card
                  key={item.step}
                  className="transition-all hover:border-primary/30 hover:shadow-sm"
                >
                  <CardContent className="flex flex-col gap-3 p-5">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[13px] font-extrabold text-primary">
                        {item.step}
                      </span>
                      <span className="material-symbols-outlined text-xl text-muted-foreground">
                        {item.icon}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <button
              type="button"
              className="self-end text-xs text-muted-foreground underline hover:text-foreground"
              onClick={() => {
                localStorage.setItem("resume-prep-guide-dismissed", "1");
                setShowGuide(false);
              }}
            >
              다시 보지 않기
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="flex items-center gap-1 self-start text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setShowGuide(true)}
          >
            <span className="material-symbols-outlined text-sm">help_outline</span>
            이용 방법 보기
          </button>
        )}

        {/* 설정 폼 */}
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
          <div className="flex flex-col gap-6">
            {/* 필수 설정 */}
            <div className="flex flex-col gap-4">
              <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                필수 설정
              </p>

              {/* 이력서 카드 피커 */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-semibold text-foreground">
                  이력서 <span className="text-primary">*</span>
                </span>
                <FilePicker
                  files={resumes}
                  selectedId={selectedResumeId}
                  onSelect={setSelectedResumeId}
                  emptyMessage="업로드된 이력서가 없습니다."
                />
                <p className="text-xs text-muted-foreground">
                  <Link href="/profile" className="font-semibold text-primary underline">
                    프로필 페이지
                  </Link>
                  에서 이력서를 업로드하면 여기에 표시됩니다.
                </p>
              </div>

              {/* 포트폴리오 카드 피커 */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-semibold text-foreground">
                  포트폴리오 파일 <span className="text-[11px] font-normal text-muted-foreground">(선택)</span>
                </span>
                <FilePicker
                  files={portfolios}
                  selectedId={selectedPortfolioId}
                  onSelect={setSelectedPortfolioId}
                  allowDeselect
                  emptyMessage="업로드된 포트폴리오가 없습니다."
                />
              </div>

              {/* 포지션 — Tabs */}
              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-semibold text-foreground">
                  포지션 <span className="text-primary">*</span>
                </span>

                <Tabs defaultValue={POSITION_CATEGORIES[0].label}>
                  <TabsList variant="line">
                    {POSITION_CATEGORIES.map((cat) => (
                      <TabsTrigger key={cat.label} value={cat.label}>
                        {cat.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {POSITION_CATEGORIES.map((category) => (
                    <TabsContent key={category.label} value={category.label}>
                      <div className="flex flex-wrap gap-1.5 pt-2">
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
                              <span className="material-symbols-outlined text-sm">{pos.icon}</span>
                              {pos.label}
                            </button>
                          );
                        })}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>

                {/* 직접 입력 */}
                <div className="flex gap-2">
                  <Input
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

                <p className="text-xs text-muted-foreground">
                  선택됨:{" "}
                  <span className="font-semibold text-foreground">
                    {ALL_POSITIONS.find((p) => p.id === positionType)?.label ?? positionType}
                  </span>
                </p>
              </div>
            </div>

            <Separator />

            {/* 추가 설정 */}
            <div className="flex flex-col gap-4">
              <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                추가 설정
              </p>

              {/* 기술 스택 */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-semibold text-foreground">
                  채용공고 기술 스택 <span className="text-[11px] font-normal text-muted-foreground">(선택)</span>
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
                            selected ? prev.filter((t) => t !== tech) : [...prev, tech]
                          )
                        }
                      >
                        {tech}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <Input
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
                        onClick={() => setTargetTechs((prev) => prev.filter((t) => t !== tech))}
                      >
                        {tech}
                        <span className="material-symbols-outlined text-xs">close</span>
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
            </div>

            {/* CTA — Pulse E3 */}
            <Button
              size="lg"
              className={cn("w-full gap-2", createSession.isPending && "animate-pulse-glow")}
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
                  <span className="material-symbols-outlined text-sm">smart_toy</span>
                  AI 분석 시작
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
          </div>
        )}

        <AnalysisProgressOverlay
          isActive={showOverlay && createSession.isPending}
          isComplete={showOverlay && !createSession.isPending}
        />
      </div>
    );
  }

  // ─── Phase 2: Session Completed ───
  if (isCompleted) {
    return (
      <div className="flex flex-col gap-6">
        <SessionCompletedView
          session={session}
          attemptedCount={attemptedCount}
          totalCount={totalCount}
          feedbackByQuestion={feedbackByQuestion}
          onResetSession={resetSession}
        />
        <AnalysisProgressOverlay
          isActive={showOverlay && createSession.isPending}
          isComplete={showOverlay && !createSession.isPending}
        />
      </div>
    );
  }

  // ─── Phase 2: Practice Session — Pulse 3-col ───
  const currentIdx = questions.findIndex((q) => q.id === activeQuestionId);
  const hasFeedback = !!activeFeedback && !createFeedback.isPending;

  return (
    <div className="-mx-6 -mt-6">
      <div className="grid min-h-[calc(100vh-3rem)] grid-cols-1 md:grid-cols-[220px_1fr] xl:grid-cols-[220px_1fr_240px]">

        {/* ── LEFT nav (260px) ─────────────────────────────────── */}
        <aside className="sticky top-0 flex max-h-[calc(100vh-3rem)] w-[220px] shrink-0 flex-col overflow-hidden border-r border-border bg-card">
          {/* Header: session meta + progress */}
          <div className="shrink-0 border-b border-border px-4 py-3">
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              {session.title || "면접 연습"}
            </p>
            {session.positionType && (
              <p className="mt-0.5 font-mono text-[10px] text-muted-foreground/60">
                {ALL_POSITIONS.find((p) => p.id === session.positionType)?.label ?? session.positionType}
              </p>
            )}
            <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between">
              <span className="text-[11px] text-muted-foreground">
                진행률 {Math.round(progressPercent)}%
              </span>
              <span className="text-[11px] text-muted-foreground">
                {attemptedCount}/{totalCount} 완료
              </span>
            </div>
          </div>

          {/* Scrollable question list */}
          <div className="flex-1 overflow-y-auto p-2.5">
            {(createSession.isPending || (sessionQuery.isFetching && !session)) ? (
              <QuestionSkeleton />
            ) : null}
            {questions.map((q, idx) => {
              const done = !!feedbackByQuestion[q.id];
              const active = q.id === activeQuestionId;
              return (
                <button
                  key={q.id}
                  type="button"
                  className={cn(
                    "mb-1 flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors",
                    active ? "bg-primary/10" : "hover:bg-muted/50"
                  )}
                  onClick={() => setActiveQuestionId(q.id)}
                >
                  {/* Status circle */}
                  <div
                    className={cn(
                      "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                      done
                        ? "bg-[oklch(0.52_0.18_150)]"
                        : active
                          ? "bg-primary"
                          : "bg-border"
                    )}
                  >
                    {done ? (
                      <span className="material-symbols-outlined text-[11px] text-white">check</span>
                    ) : (
                      <span
                        className={cn(
                          "text-[10px] font-bold",
                          active ? "text-white" : "text-muted-foreground"
                        )}
                      >
                        {idx + 1}
                      </span>
                    )}
                  </div>
                  {/* Text */}
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-[11px] font-semibold",
                        done
                          ? "text-[oklch(0.52_0.18_150)]"
                          : active
                            ? "text-primary"
                            : "text-muted-foreground"
                      )}
                    >
                      {q.badge}
                    </p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{q.question}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="shrink-0 flex flex-col gap-2 border-t border-border px-3 py-3">
            <Link href="/resume-analyzer" className="block">
              <button
                type="button"
                className="w-full rounded-lg border border-border py-2 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              >
                ← 세션 목록으로
              </button>
            </Link>
            <div className="flex gap-2">
              <Button
                variant={allAnswered ? "default" : "outline"}
                size="sm"
                className="flex-1"
                disabled={completeSession.isPending}
                onClick={() => void onCompleteSession()}
              >
                <span className="material-symbols-outlined mr-1 text-sm">
                  {completeSession.isPending ? "progress_activity" : "task_alt"}
                </span>
                {completeSession.isPending ? "처리 중..." : "세션 완료"}
              </Button>
              <Button variant="outline" size="sm" onClick={resetSession}>
                <span className="material-symbols-outlined text-sm">add</span>
              </Button>
            </div>
          </div>
        </aside>

        {/* ── CENTER ───────────────────────────────────────────── */}
        <main className="flex flex-col bg-background">
          {!activeQuestion ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
              <span className="material-symbols-outlined text-4xl text-muted-foreground/40">
                quiz
              </span>
              <p className="text-sm text-muted-foreground">왼쪽에서 질문을 선택해 주세요.</p>
            </div>
          ) : (
            <>
              {/* C1: Question header */}
              <div className="shrink-0 border-b border-border bg-card px-6 py-5">
                <div className="mb-3 flex items-center gap-2.5">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                    {activeQuestion.badge}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    질문 {currentIdx + 1} / {totalCount}
                  </span>
                  <span className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground">
                    <span className="material-symbols-outlined text-xs">trending_up</span>
                    출제 확률 {activeQuestion.likelihood}%
                  </span>
                </div>
                <p className="text-[17px] font-semibold leading-relaxed text-foreground">
                  {activeQuestion.question ?? "(질문 내용이 비어있습니다)"}
                </p>
              </div>

              {/* C2: Answer area + C4: Inline feedback */}
              {(() => {
                const attemptCount = activeQuestion.attempts.length;
                const maxAttempts = activeQuestion.maxAttempts;
                const isAtMax = attemptCount >= maxAttempts;

                return (
                  <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
                    {/* Answer label + counters */}
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-semibold text-muted-foreground">
                        내 답변
                      </span>
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "text-xs tabular-nums",
                            isAtMax
                              ? "font-semibold text-destructive"
                              : attemptCount > 0
                                ? "text-amber-600"
                                : "text-muted-foreground"
                          )}
                        >
                          {attemptCount}/{maxAttempts}회
                        </span>
                        {!isAtMax && !hasFeedback && (
                          <span className="text-[11px] text-muted-foreground">
                            {activeAnswer.length}자
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Textarea or max attempts notice */}
                    {isAtMax ? (
                      <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                        <span className="material-symbols-outlined text-base">block</span>
                        최대 답변 횟수({maxAttempts}회)에 도달했습니다. 새 세션을 시작해 주세요.
                      </div>
                    ) : (
                      <Textarea
                        className={cn(
                          "min-h-[200px] resize-y p-4 text-sm leading-relaxed transition-colors",
                          hasFeedback
                            ? "border-border bg-muted/30"
                            : "border-primary/25 bg-background focus-visible:ring-primary/20"
                        )}
                        placeholder="답변을 입력하세요. 실제 면접처럼 구체적이고 구조화된 답변을 작성해보세요..."
                        value={activeAnswer}
                        onChange={(e) => {
                          if (!activeQuestionId || hasFeedback) return;
                          setAnswersByQuestion((prev) => ({
                            ...prev,
                            [activeQuestionId]: e.target.value,
                          }));
                        }}
                      />
                    )}

                    {/* STAR tip (before feedback) */}
                    {!hasFeedback && !createFeedback.isPending && !isAtMax && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="material-symbols-outlined text-sm">lightbulb</span>
                        STAR 기법 (Situation → Task → Action → Result)을 활용해 보세요.
                      </div>
                    )}

                    {/* C4: AI Feedback inline */}
                    {createFeedback.isPending && <FeedbackSkeleton />}
                    {!createFeedback.isPending && activeFeedback && (
                      <div className="rounded-xl border border-border bg-card p-5">
                        <div className="mb-4 flex items-center gap-2">
                          <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <span className="material-symbols-outlined text-sm text-primary">
                              smart_toy
                            </span>
                          </div>
                          <span className="text-[13px] font-bold text-foreground">AI 피드백</span>
                        </div>
                        <FeedbackPanelContent
                          feedback={activeFeedback}
                          modelAnswer={activeQuestion.modelAnswer}
                          userAnswer={activeAnswer}
                        />
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* C3: Bottom action bar */}
              {(() => {
                const attemptCount = activeQuestion.attempts.length;
                const maxAttempts = activeQuestion.maxAttempts;
                const isAtMax = attemptCount >= maxAttempts;

                return (
                  <div className="shrink-0 flex items-center justify-between border-t border-border bg-card px-6 py-3.5">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentIdx <= 0}
                      onClick={() => {
                        if (currentIdx > 0) setActiveQuestionId(questions[currentIdx - 1].id);
                      }}
                    >
                      ← 이전
                    </Button>
                    <div className="flex items-center gap-2">
                      {!hasFeedback ? (
                        <Button
                          size="sm"
                          className="gap-2 px-6"
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
                              <span className="material-symbols-outlined text-sm">smart_toy</span>
                              AI 피드백 받기
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button size="sm" className="gap-2 px-6" onClick={goToNextQuestion}>
                          {currentIdx < questions.length - 1 ? (
                            <>다음 질문 →</>
                          ) : (
                            <>세션 완료 ✓</>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </main>

        {/* ── RIGHT metadata (260px, xl only) ─────────────────── */}
        <div className="sticky top-0 hidden max-h-[calc(100vh-3rem)] flex-col overflow-y-auto border-l border-border bg-card xl:flex">
          <div className="shrink-0 border-b border-border px-4 py-3">
            <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              출제 의도
            </span>
          </div>
          <div className="flex flex-col gap-5 px-4 py-4">
            {activeQuestion ? (
              <>
                {/* 의도 */}
                {activeQuestion.intention ? (
                  <p className="text-[13px] leading-relaxed text-muted-foreground">
                    {activeQuestion.intention}
                  </p>
                ) : (
                  <p className="text-[13px] text-muted-foreground/50">출제 의도 정보가 없습니다.</p>
                )}

                {/* 핵심 키워드 */}
                {activeKeywords.length > 0 && (
                  <div>
                    <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                      핵심 키워드
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {activeKeywords.map((kw) => (
                        <span
                          key={kw}
                          className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[12px] font-semibold text-primary"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 답변 팁 */}
                <div className="rounded-lg border border-border bg-background p-3.5">
                  <p className="mb-2 text-[11px] font-bold text-muted-foreground">답변 팁</p>
                  <p className="text-[12px] leading-relaxed text-muted-foreground">
                    STAR 기법 (Situation → Task → Action → Result)으로 구조화하면 논리적인 답변이 됩니다.
                  </p>
                </div>

                {/* 세션 현황 */}
                <div>
                  <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                    세션 현황
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {questions.map((q, i) => {
                      const done = !!feedbackByQuestion[q.id];
                      const active = q.id === activeQuestionId;
                      return (
                        <div key={q.id} className="flex items-center gap-2">
                          <div
                            className={cn(
                              "size-3 shrink-0 rounded-full",
                              done
                                ? "bg-[oklch(0.52_0.18_150)]"
                                : active
                                  ? "bg-primary"
                                  : "bg-border"
                            )}
                          />
                          <span
                            className={cn(
                              "truncate text-[11px]",
                              done
                                ? "text-[oklch(0.52_0.18_150)]"
                                : active
                                  ? "font-medium text-foreground"
                                  : "text-muted-foreground"
                            )}
                          >
                            Q{i + 1}. {q.badge}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-[13px] text-muted-foreground/50">
                질문을 선택하면 정보가 표시됩니다.
              </p>
            )}
          </div>
        </div>
      </div>

      <AnalysisProgressOverlay
        isActive={showOverlay && createSession.isPending}
        isComplete={showOverlay && !createSession.isPending}
      />
    </div>
  );
}

// ─── Feedback Skeleton ───
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
    <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-8">
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
        <span className="material-symbols-outlined animate-spin text-2xl text-primary">
          progress_activity
        </span>
      </div>
      <p className="text-sm font-medium text-foreground">{FEEDBACK_MESSAGES[msgIdx]}...</p>
      <p className="text-xs text-muted-foreground">AI가 꼼꼼하게 평가하고 있습니다</p>
    </div>
  );
}

// ─── Feedback Panel Content ───
function FeedbackPanelContent({
  feedback,
  modelAnswer,
  userAnswer,
}: {
  feedback: ResumeFeedback;
  modelAnswer: string | null;
  userAnswer: string;
}) {
  return (
    <div>
      <Tabs defaultValue="evaluation">
        <TabsList>
          <TabsTrigger value="evaluation">
            <span className="material-symbols-outlined mr-1 text-sm">check_circle</span>
            평가
          </TabsTrigger>
          <TabsTrigger value="ai-answer">
            <span className="material-symbols-outlined mr-1 text-sm">auto_fix_high</span>
            AI 개선 답변
          </TabsTrigger>
          {modelAnswer && (
            <TabsTrigger value="compare">
              <span className="material-symbols-outlined mr-1 text-sm">compare</span>
              비교
            </TabsTrigger>
          )}
          {feedback.followups.length > 0 && (
            <TabsTrigger value="followups">
              <span className="material-symbols-outlined mr-1 text-sm">forum</span>
              후속 질문
              <Badge variant="secondary" className="ml-1 text-xs">
                {feedback.followups.length}
              </Badge>
            </TabsTrigger>
          )}
        </TabsList>

        {/* 평가 */}
        <TabsContent value="evaluation">
          <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-[oklch(0.52_0.10_175)]">
                  thumb_up
                </span>
                <p className="text-xs font-bold uppercase tracking-wider text-[oklch(0.52_0.10_175)]">
                  잘한 점
                </p>
              </div>
              <ul className="space-y-2 text-sm text-foreground">
                {feedback.strengths.length > 0 ? (
                  feedback.strengths.map((s, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="material-symbols-outlined mt-0.5 text-sm text-[oklch(0.52_0.10_175)]">
                        check_circle
                      </span>
                      <span>{s}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-muted-foreground">항목이 없습니다.</li>
                )}
              </ul>
            </div>
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-muted-foreground">
                  tips_and_updates
                </span>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  개선할 점
                </p>
              </div>
              <ul className="space-y-2 text-sm text-foreground">
                {feedback.improvements.length > 0 ? (
                  feedback.improvements.map((s, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="material-symbols-outlined mt-0.5 text-sm text-muted-foreground">
                        arrow_upward
                      </span>
                      <span>{s}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-muted-foreground">항목이 없습니다.</li>
                )}
              </ul>
            </div>
          </div>
        </TabsContent>

        {/* AI 개선 답변 */}
        <TabsContent value="ai-answer">
          {feedback.suggestedAnswer ? (
            <div className="pt-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
                {feedback.suggestedAnswer}
              </p>
            </div>
          ) : (
            <p className="pt-4 text-sm text-muted-foreground">AI 개선 답변이 없습니다.</p>
          )}
        </TabsContent>

        {/* 비교 */}
        {modelAnswer && (
          <TabsContent value="compare">
            <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2">
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  내 답변
                </p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {userAnswer || "(작성한 답변이 없습니다)"}
                </p>
              </div>
              <div className="rounded-lg bg-primary/5 p-3">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">
                  모범 답변
                </p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {modelAnswer}
                </p>
              </div>
            </div>
          </TabsContent>
        )}

        {/* 후속 질문 */}
        {feedback.followups.length > 0 && (
          <TabsContent value="followups">
            <ul className="space-y-2 pt-4">
              {feedback.followups.map((fq, idx) => (
                <li key={idx} className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {idx + 1}
                  </span>
                  <p className="text-sm text-foreground">{fq}</p>
                </li>
              ))}
            </ul>
          </TabsContent>
        )}
      </Tabs>
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
  const totalImprovements = feedbacks.reduce((sum, f) => sum + f.improvements.length, 0);
  const avgStrengths =
    feedbacks.length > 0 ? Math.round((totalStrengths / feedbacks.length) * 10) / 10 : 0;
  const avgImprovements =
    feedbacks.length > 0 ? Math.round((totalImprovements / feedbacks.length) * 10) / 10 : 0;

  const completedAtLabel = session.completedAt
    ? new Date(session.completedAt).toLocaleString("ko-KR")
    : null;

  const reportQuery = useSessionReport(session.id);
  const report = reportQuery.data ?? null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-[oklch(0.52_0.18_150)]/15">
            <span className="material-symbols-outlined text-4xl text-[oklch(0.52_0.18_150)]"
              style={{ fontVariationSettings: '"FILL" 1, "wght" 400, "GRAD" 0, "opsz" 24' }}>
              task_alt
            </span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">면접 세션을 완료했습니다</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              수고하셨어요. 이번 세션의 결과를 정리했습니다.
            </p>
            {completedAtLabel && (
              <p className="mt-1 text-xs text-muted-foreground">완료 시각: {completedAtLabel}</p>
            )}
          </div>
          {report && (
            <div className="flex flex-col items-center gap-0.5">
              <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                종합 점수
              </span>
              <div className="flex items-end gap-1">
                <span
                  className={cn(
                    "text-5xl font-bold tabular-nums",
                    report.overallScore >= 8
                      ? "text-[oklch(0.52_0.18_150)]"
                      : report.overallScore >= 5
                        ? "text-foreground"
                        : "text-[oklch(0.52_0.20_25)]"
                  )}
                >
                  {report.overallScore}
                </span>
                <span className="mb-1.5 text-sm text-muted-foreground">/10</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
          <StatTile icon="quiz" label="답변한 질문" value={`${attemptedCount} / ${totalCount}`} tone="primary" />
          <StatTile icon="thumb_up" label="평균 강점 수" value={avgStrengths.toString()} tone="teal" />
          <StatTile icon="tips_and_updates" label="평균 개선점 수" value={avgImprovements.toString()} tone="neutral" />
        </CardContent>
      </Card>

      {reportQuery.isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-8">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
              <span className="material-symbols-outlined animate-spin text-2xl text-primary">
                progress_activity
              </span>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">AI 회고 리포트 생성 중...</p>
              <p className="mt-1 text-xs text-muted-foreground">
                세션 데이터를 분석하고 있습니다. 잠시만 기다려 주세요.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : reportQuery.isError ? (
        <Card className="border-destructive/30">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <span className="material-symbols-outlined">error</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">리포트 생성에 실패했습니다</p>
              <p className="text-xs text-muted-foreground">
                {reportQuery.error instanceof Error
                  ? reportQuery.error.message
                  : "알 수 없는 오류"}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => reportQuery.refetch()}>
              재시도
            </Button>
          </CardContent>
        </Card>
      ) : report ? (
        <SessionReportCard report={report} />
      ) : null}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/resume-analyzer">
          <Button variant="outline" size="lg">
            <span className="material-symbols-outlined mr-1 text-sm">arrow_back</span>
            세션 목록으로
          </Button>
        </Link>
        <Link href="/resume-analyzer/report">
          <Button variant="outline" size="lg">
            <span className="material-symbols-outlined mr-1 text-sm">analytics</span>
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
  const [openBadges, setOpenBadges] = useState<Set<string>>(
    () => new Set(report.badgeSummaries.slice(0, 1).map((b) => b.badge))
  );

  function toggleBadge(badge: string) {
    setOpenBadges((prev) => {
      const next = new Set(prev);
      if (next.has(badge)) next.delete(badge);
      else next.add(badge);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <span className="material-symbols-outlined">auto_awesome</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground">AI 회고 리포트</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {report.executiveSummary}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {report.badgeSummaries.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">category</span>
              <p className="text-sm font-semibold text-foreground">유형별 분석</p>
            </div>
            <div className="space-y-2">
              {report.badgeSummaries.map((bs) => {
                const isOpen = openBadges.has(bs.badge);
                return (
                  <div key={bs.badge} className="overflow-hidden rounded-xl border border-border">
                    <button
                      onClick={() => toggleBadge(bs.badge)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/30"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="text-sm font-semibold text-foreground">{bs.badge}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          강점 {bs.strengths.length} · 약점 {bs.weaknesses.length}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "material-symbols-outlined shrink-0 text-sm text-muted-foreground transition-transform duration-200",
                          isOpen && "rotate-180"
                        )}
                      >
                        expand_more
                      </span>
                    </button>
                    {isOpen && (
                      <div className="border-t border-border px-4 pb-4 pt-3">
                        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                          {bs.summary}
                        </p>
                        {(bs.strengths.length > 0 || bs.weaknesses.length > 0) && (
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {bs.strengths.length > 0 && (
                              <div>
                                <p className="mb-2 text-xs font-semibold text-[oklch(0.52_0.10_175)]">
                                  강점
                                </p>
                                <ul className="space-y-2">
                                  {bs.strengths.map((s, i) => (
                                    <li key={i} className="flex items-start gap-1.5 text-sm text-foreground">
                                      <span className="mt-1 shrink-0 text-[oklch(0.52_0.10_175)]">•</span>
                                      <span>{s}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {bs.weaknesses.length > 0 && (
                              <div>
                                <p className="mb-2 text-xs font-semibold text-muted-foreground">약점</p>
                                <ul className="space-y-2">
                                  {bs.weaknesses.map((w, i) => (
                                    <li key={i} className="flex items-start gap-1.5 text-sm text-foreground">
                                      <span className="mt-1 shrink-0 text-muted-foreground">•</span>
                                      <span>{w}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {report.repeatedGaps.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-destructive">warning</span>
              <p className="text-sm font-semibold text-foreground">반복 역량 갭</p>
            </div>
            <ul className="space-y-2">
              {report.repeatedGaps.map((gap, i) => (
                <li key={i} className="flex items-start gap-3 rounded-lg bg-destructive/5 p-3">
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

      {report.topImprovements.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">trending_up</span>
              <p className="text-sm font-semibold text-foreground">Top 3 개선 포인트</p>
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
                    <p className="text-sm font-semibold text-foreground">{imp.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{imp.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-primary/20 bg-primary/[0.06]">
        <CardContent className="flex items-start gap-3 p-5">
          <span className="material-symbols-outlined mt-0.5 text-primary"
            style={{ fontVariationSettings: '"FILL" 1, "wght" 400, "GRAD" 0, "opsz" 24' }}>
            auto_awesome
          </span>
          <p className="text-sm leading-relaxed text-foreground">{report.closingAdvice}</p>
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
  tone: "primary" | "teal" | "neutral";
}) {
  const toneClass =
    tone === "teal"
      ? "text-[oklch(0.52_0.18_150)] bg-[oklch(0.52_0.18_150)]/10"
      : tone === "neutral"
        ? "text-foreground bg-card"
        : "text-primary bg-primary/10";

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border p-3">
      <div
        className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", toneClass)}
      >
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="text-lg font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}

// ─── File Picker ───
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function FilePicker({
  files,
  selectedId,
  onSelect,
  allowDeselect = false,
  emptyMessage = "파일이 없습니다.",
}: {
  files: ResumeFile[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  allowDeselect?: boolean;
  emptyMessage?: string;
}) {
  if (files.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {/* 선택 해제 버튼 (optional) */}
      {allowDeselect && (
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={cn(
            "flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-left text-sm transition-all",
            selectedId === null
              ? "border-border bg-muted/50 font-medium text-muted-foreground"
              : "border-border text-muted-foreground hover:bg-muted/30"
          )}
        >
          <span className="material-symbols-outlined text-base text-muted-foreground/60">
            block
          </span>
          선택 안 함
          {selectedId === null && (
            <span className="ml-auto flex size-4 items-center justify-center rounded-full bg-muted-foreground/20">
              <span className="material-symbols-outlined text-[11px] text-muted-foreground">check</span>
            </span>
          )}
        </button>
      )}

      {/* 파일 카드들 */}
      {files.map((f) => {
        const isSelected = selectedId === f.id;
        const displayName = f.originalFilename ?? f.title ?? "이름 없음";

        return (
          <button
            key={f.id}
            type="button"
            onClick={() => onSelect(isSelected && allowDeselect ? null : f.id)}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all",
              isSelected
                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                : "border-border bg-card hover:border-primary/40 hover:bg-accent/30"
            )}
          >
            {/* 파일 아이콘 */}
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors",
                isSelected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}
            >
              <span className="material-symbols-outlined text-[20px]">description</span>
            </div>

            {/* 파일 정보 */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-foreground">{displayName}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {new Date(f.createdAt).toLocaleDateString("ko-KR")}
                {f.sizeBytes ? ` · ${formatFileSize(f.sizeBytes)}` : ""}
              </p>
            </div>

            {/* 선택 인디케이터 */}
            <div
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border transition-all",
                isSelected
                  ? "border-primary bg-primary"
                  : "border-border bg-background"
              )}
            >
              {isSelected && (
                <span className="material-symbols-outlined text-[13px] text-white">check</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
