"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useResumeFiles } from "@/features/profile/hooks/useResumeFiles";
import type { PositionType, ResumeFeedback, ResumeSession } from "../api/types";
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
import { cn } from "@/lib/utils";

export function ResumePortfolioPrepView() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [positionType, setPositionType] = useState<PositionType>("BE");
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(
    null
  );
  const [portfolioUrl, setPortfolioUrl] = useState<string>("");
  const [sessionId, setSessionId] = useState<number | null>(null);
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

  const [showOverlay, setShowOverlay] = useState(false);

  const isBusy =
    createSession.isPending ||
    sessionQuery.isFetching ||
    createFeedback.isPending;

  async function onCreateSession() {
    if (!selectedResumeId) {
      alert("이력서를 먼저 선택해 주세요.");
      return;
    }

    setShowOverlay(true);

    try {
      const created = await createSession.mutateAsync({
        positionType,
        resumeId: selectedResumeId,
        portfolioResumeId: selectedPortfolioId,
        portfolioUrl: portfolioUrl.trim() ? portfolioUrl.trim() : null,
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
      alert("답변을 작성해 주세요.");
      return;
    }

    const fb = await createFeedback.mutateAsync({
      questionId: activeQuestionId,
      answerText: activeAnswer,
    });
    setFeedbackByQuestion((prev) => ({ ...prev, [activeQuestionId]: fb }));
  }

  const hasNoFiles = !isLoadingFiles && resumes.length === 0;

  return (
    <div className="flex flex-col gap-8">
      {/* Setup cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Resume selection */}
        <Card className="transition-shadow hover:shadow-md">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <span className="material-symbols-outlined">description</span>
              </div>
              <h3 className="text-lg font-bold text-foreground">이력서 선택</h3>
            </div>

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
              <div className="flex h-full flex-col gap-4">
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
                </label>
                <p className="text-xs text-muted-foreground">
                  프로필 페이지에서 이력서를 업로드하면 여기에 표시됩니다.{" "}
                  <Link
                    href="/profile"
                    className="font-semibold text-primary underline"
                  >
                    프로필로 이동
                  </Link>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Portfolio & position */}
        <Card className="transition-shadow hover:shadow-md">
          <CardContent className="flex flex-col p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <span className="material-symbols-outlined">link</span>
              </div>
              <h3 className="text-lg font-bold text-foreground">포트폴리오</h3>
            </div>

            <div className="flex flex-1 flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  포지션
                </span>
                <select
                  className="w-full rounded-lg border border-input bg-background p-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/20"
                  value={positionType}
                  onChange={(e) =>
                    setPositionType(e.target.value as PositionType)
                  }
                >
                  <option value="BE">Backend (BE)</option>
                  <option value="FE">Frontend (FE)</option>
                  <option value="MOBILE">Mobile</option>
                </select>
              </label>
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
              <Button
                className={cn(
                  "mt-auto w-full gap-2",
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
              {createSession.error ? (
                <p className="text-sm font-semibold text-destructive">
                  생성 오류:{" "}
                  {createSession.error instanceof Error
                    ? createSession.error.message
                    : String(createSession.error)}
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Question list + answer area */}
      <div className="mt-4 grid grid-cols-1 gap-8 xl:grid-cols-12">
        {/* Question sidebar */}
        <section className="flex flex-col gap-4 xl:col-span-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
              <span className="material-symbols-outlined text-primary">
                psychology
              </span>
              생성된 질문
            </h2>
            <Badge variant="secondary">{totalCount}개</Badge>
          </div>

          <div className="custom-scrollbar flex max-h-[800px] flex-col gap-3 overflow-y-auto pr-2">
            {createSession.isPending ||
            (sessionQuery.isFetching && !session) ? (
              <QuestionSkeleton />
            ) : null}
            {!createSession.isPending && !questions.length ? (
              <Card className="border-dashed">
                <CardContent className="p-4 text-sm text-muted-foreground">
                  아직 생성된 질문이 없어요. 먼저 이력서를 선택하고 질문을
                  생성해 주세요.
                </CardContent>
              </Card>
            ) : null}
            {questions.map((q) => (
              <QuestionCard
                key={q.id}
                badge={q.badge}
                badgeTone={q.id === activeQuestionId ? "primary" : "muted"}
                likelihood={q.likelihood}
                text={q.question ?? "(질문 내용이 비어있습니다)"}
                active={q.id === activeQuestionId}
                onClick={() => setActiveQuestionId(q.id)}
              />
            ))}
          </div>
        </section>

        {/* Answer area */}
        <section className="flex flex-col gap-6 xl:col-span-8">
          <Card className="flex flex-col overflow-hidden shadow-lg">
            {/* Question header */}
            <div className="border-b border-border bg-muted/30 p-6">
              <Badge variant="outline" className="mb-2 text-[10px]">
                진행 중인 연습 세션
              </Badge>
              <p className="text-lg font-bold text-foreground">
                {activeQuestion?.question ?? "왼쪽에서 질문을 선택해 주세요."}
              </p>
            </div>

            {/* Answer input */}
            <div className="flex flex-1 flex-col gap-4 p-6">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="material-symbols-outlined text-sm">
                  lightbulb
                </span>
                팁: STAR 기법(Situation, Task, Action, Result)을 활용해 보세요.
              </div>

              <Textarea
                className="min-h-[280px] flex-1 resize-none border-none bg-muted/30 p-5 text-base leading-relaxed placeholder:text-muted-foreground/50 focus-visible:ring-primary/20"
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

              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {["mic", "format_list_bulleted", "code"].map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      aria-label={icon}
                    >
                      <span className="material-symbols-outlined text-lg">
                        {icon}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="flex flex-col items-end gap-1">
                  <Button
                    className="gap-2 px-8 shadow-md shadow-primary/15"
                    disabled={!activeQuestionId || isBusy}
                    onClick={() => void onCreateFeedback()}
                  >
                    {createFeedback.isPending ? (
                      <>
                        <span className="material-symbols-outlined animate-spin">
                          progress_activity
                        </span>
                        피드백 생성 중...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">
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
            </div>

            {/* Feedback panel */}
            <div className="border-t border-border bg-muted/20 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="flex items-center gap-2 font-bold text-foreground">
                  <span className="material-symbols-outlined text-emerald-500">
                    check_circle
                  </span>
                  AI 평가
                </h4>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Strengths */}
                <Card className="border-l-4 border-l-emerald-500">
                  <CardContent className="p-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-600">
                      잘한 점
                    </p>
                    <ul className="space-y-2 text-sm text-foreground">
                      {activeFeedback?.strengths?.length ? (
                        activeFeedback.strengths.map((s, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-sm text-emerald-500">
                              done
                            </span>
                            {s}
                          </li>
                        ))
                      ) : (
                        <li className="text-muted-foreground">
                          아직 피드백이 없어요.
                        </li>
                      )}
                    </ul>
                  </CardContent>
                </Card>

                {/* Improvements */}
                <Card className="border-l-4 border-l-amber-500">
                  <CardContent className="p-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-600">
                      개선할 점
                    </p>
                    <ul className="space-y-2 text-sm text-foreground">
                      {activeFeedback?.improvements?.length ? (
                        activeFeedback.improvements.map((s, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-sm text-amber-500">
                              info
                            </span>
                            {s}
                          </li>
                        ))
                      ) : (
                        <li className="text-muted-foreground">
                          아직 피드백이 없어요.
                        </li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-4 border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">
                    AI 개선 예시 답변
                  </p>
                  <p className="text-sm italic leading-relaxed text-foreground/80">
                    {activeFeedback?.suggestedAnswer
                      ? activeFeedback.suggestedAnswer
                      : "피드백을 생성하면 개선 예시 답변이 표시됩니다."}
                  </p>
                </CardContent>
              </Card>

              {createFeedback.error ? (
                <p className="mt-4 text-sm font-semibold text-destructive">
                  피드백 오류:{" "}
                  {createFeedback.error instanceof Error
                    ? createFeedback.error.message
                    : String(createFeedback.error)}
                </p>
              ) : null}
            </div>
          </Card>
        </section>
      </div>

      {/* Progress bar */}
      <Card className="mt-4">
        <CardContent className="flex flex-wrap items-center justify-between gap-6 p-6">
          <div className="flex items-center gap-8">
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                시도한 질문
              </span>
              <span className="text-2xl font-black text-primary">
                {attemptedCount.toString().padStart(2, "0")} /{" "}
                {totalCount.toString().padStart(2, "0")}
              </span>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                피드백 상태
              </span>
              <span className="text-2xl font-black text-emerald-500">
                {isBusy ? "진행 중" : "대기"}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" disabled className="gap-2">
              <span className="material-symbols-outlined">download</span>
              연습 기록 내보내기
            </Button>
            <Button
              className="gap-2"
              disabled={!questions.length}
              onClick={() => {
                if (!questions.length) return;
                const idx = questions.findIndex(
                  (q) => q.id === activeQuestionId
                );
                const next = questions[(idx + 1) % questions.length];
                setActiveQuestionId(next.id);
              }}
            >
              <span className="material-symbols-outlined">navigate_next</span>
              다음 연습 세션
            </Button>
          </div>
        </CardContent>
      </Card>

      <AnalysisProgressOverlay
        isActive={showOverlay && createSession.isPending}
        isComplete={showOverlay && !createSession.isPending}
      />
    </div>
  );
}

function QuestionCard({
  badge,
  badgeTone,
  likelihood,
  text,
  active,
  onClick,
}: {
  badge: string;
  badgeTone: "primary" | "muted";
  likelihood: number;
  text: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <Card
      className={cn(
        "group cursor-pointer border-l-4 transition-all hover:shadow-md",
        active
          ? "border-l-primary bg-primary/5"
          : "border-l-transparent hover:border-l-primary/30"
      )}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick?.();
      }}
    >
      <CardContent className="p-4">
        <div className="mb-2 flex items-start justify-between">
          <Badge
            variant={badgeTone === "primary" ? "default" : "secondary"}
            className="text-[10px]"
          >
            {badge}
          </Badge>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="material-symbols-outlined text-xs">
              trending_up
            </span>
            {likelihood}%
          </span>
        </div>
        <p className="text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
          {text}
        </p>
      </CardContent>
    </Card>
  );
}
