"use client";

import { useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDevMemberId } from "@/features/member/hooks/useDevMemberId";
import type { PositionType, ResumeFeedback, ResumeSession } from "../api/types";
import {
  useCreateResumeFeedback,
  useCreateResumeSession,
} from "../hooks/useResumeMutations";
import { useResumeSession } from "../hooks/useResumeSession";

export function ResumePortfolioPrepView() {
  const queryClient = useQueryClient();
  const { memberId, isBootstrapping, error: memberError } = useDevMemberId();

  const [positionType, setPositionType] = useState<PositionType>("BE");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [portfolioFile, setPortfolioFile] = useState<File | null>(null);
  const [portfolioUrl, setPortfolioUrl] = useState<string>("");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);
  const [answersByQuestion, setAnswersByQuestion] = useState<Record<number, string>>({});
  const [feedbackByQuestion, setFeedbackByQuestion] = useState<
    Record<number, ResumeFeedback>
  >({});

  const resumeInputRef = useRef<HTMLInputElement | null>(null);
  const portfolioInputRef = useRef<HTMLInputElement | null>(null);

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

  const isBusy =
    isBootstrapping ||
    createSession.isPending ||
    sessionQuery.isFetching ||
    createFeedback.isPending;

  async function onCreateSession() {
    if (!memberId) return;
    if (!resumeFile) {
      alert("이력서 파일을 먼저 선택해 주세요.");
      return;
    }

    const created = await createSession.mutateAsync({
      memberId,
      positionType,
      resumeFile,
      portfolioFile: portfolioFile ?? null,
      portfolioUrl: portfolioUrl.trim() ? portfolioUrl.trim() : null,
    });

    setSessionId(created.id);
    queryClient.setQueryData(["resumeSession", created.id], created);

    const first = created.questions[0];
    setActiveQuestionId(first?.id ?? null);
    setAnswersByQuestion({});
    setFeedbackByQuestion({});
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

  function onPickResumeFile() {
    resumeInputRef.current?.click();
  }

  function onPickPortfolioFile() {
    portfolioInputRef.current?.click();
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          이력서 · 포트폴리오 면접 준비
        </h1>
        <p className="max-w-2xl text-lg text-slate-500 dark:text-slate-400">
          문서를 업로드하거나 작업 링크를 연결하면, 맞춤형 AI 질문을 생성하고 실시간으로
          답변 연습을 할 수 있어요.
        </p>
        {memberError ? (
          <p className="text-sm font-semibold text-red-600 dark:text-red-400">
            멤버 준비 오류: {memberError}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="flex flex-col rounded-xl border border-primary/10 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-white/5 dark:bg-white/5">
          <div className="mb-4 flex items-center gap-3">
            <span className="material-symbols-outlined rounded-lg bg-primary/10 p-2 text-primary">
              upload_file
            </span>
            <h3 className="text-lg font-bold">PDF 이력서 업로드</h3>
          </div>

          <input
            ref={resumeInputRef}
            type="file"
            accept=".pdf,.txt"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setResumeFile(f);
            }}
          />
          <div
            className="cursor-pointer rounded-xl border-2 border-dashed border-primary/20 bg-slate-50 p-8 transition-colors hover:bg-primary/5 dark:bg-white/5 dark:hover:bg-white/10"
            role="button"
            tabIndex={0}
            onClick={onPickResumeFile}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onPickResumeFile();
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0] ?? null;
              if (f) setResumeFile(f);
            }}
          >
            <div className="flex flex-col items-center justify-center">
              <span className="material-symbols-outlined mb-2 text-4xl text-primary/40">
                cloud_upload
              </span>
              <p className="text-center text-sm text-slate-600 dark:text-slate-300">
                PDF를 여기로 끌어오거나,{" "}
                <span className="font-bold text-primary underline">파일 찾아보기</span>
              </p>
              {resumeFile ? (
                <p className="mt-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  선택됨: {resumeFile.name}
                </p>
              ) : null}
              <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                최대 파일 크기: 5MB
              </p>
            </div>
          </div>
        </section>

        <section className="flex flex-col rounded-xl border border-primary/10 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-white/5 dark:bg-white/5">
          <div className="mb-4 flex items-center gap-3">
            <span className="material-symbols-outlined rounded-lg bg-primary/10 p-2 text-primary">
              link
            </span>
            <h3 className="text-lg font-bold">포트폴리오</h3>
          </div>

          <div className="flex h-full flex-col gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                포지션
              </span>
              <select
                className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
                value={positionType}
                onChange={(e) => setPositionType(e.target.value as PositionType)}
              >
                <option value="BE">Backend (BE)</option>
                <option value="FE">Frontend (FE)</option>
                <option value="MOBILE">Mobile</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                GitHub · Notion · 개인 웹사이트 URL
              </span>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:placeholder:text-slate-500"
                placeholder="https://github.com/username/project"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
              />
            </label>
            <div className="flex flex-col gap-2">
              <input
                ref={portfolioInputRef}
                type="file"
                accept=".pdf,.txt"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setPortfolioFile(f);
                }}
              />
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
                onClick={onPickPortfolioFile}
              >
                <span className="material-symbols-outlined text-sm">attach_file</span>
                포트폴리오 파일 추가(선택)
              </button>
              {portfolioFile ? (
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  선택됨: {portfolioFile.name}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              className="mt-auto flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-bold text-white transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={!memberId || isBusy}
              onClick={() => void onCreateSession()}
            >
              <span className="material-symbols-outlined text-sm">analytics</span>
              {createSession.isPending ? "분석 중..." : "질문 생성하기"}
            </button>
            {createSession.error ? (
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                생성 오류:{" "}
                {createSession.error instanceof Error
                  ? createSession.error.message
                  : String(createSession.error)}
              </p>
            ) : null}
          </div>
        </section>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-8 xl:grid-cols-12">
        <section className="flex flex-col gap-4 xl:col-span-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <span className="material-symbols-outlined text-primary">
                psychology
              </span>
              생성된 질문
            </h2>
            <span className="rounded bg-primary/10 px-2 py-1 text-xs font-bold text-primary">
              {totalCount}개
            </span>
          </div>

          <div className="custom-scrollbar flex max-h-[800px] flex-col gap-3 overflow-y-auto pr-2">
            {sessionQuery.isFetching && !session ? (
              <div className="rounded-lg bg-white p-4 text-sm text-slate-500 shadow-sm dark:bg-white/5 dark:text-slate-300">
                질문을 불러오는 중...
              </div>
            ) : null}
            {!questions.length ? (
              <div className="rounded-lg bg-white p-4 text-sm text-slate-500 shadow-sm dark:bg-white/5 dark:text-slate-300">
                아직 생성된 질문이 없어요. 먼저 이력서를 업로드하고 질문을 생성해 주세요.
              </div>
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

        <section className="flex flex-col gap-6 xl:col-span-8">
          <div className="flex h-full flex-col overflow-hidden rounded-xl border border-primary/10 bg-white shadow-lg dark:border-white/5 dark:bg-white/5">
            <div className="border-b border-slate-100 bg-slate-50/50 p-6 dark:border-white/5 dark:bg-white/5">
              <h3 className="mb-1 text-xs font-bold uppercase tracking-widest text-primary">
                진행 중인 연습 세션
              </h3>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                질문: {activeQuestion?.question ?? "왼쪽에서 질문을 선택해 주세요."}
              </p>
            </div>

            <div className="flex flex-1 flex-col gap-4 p-6">
              <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">
                    lightbulb
                  </span>
                  팁: STAR 기법(Situation, Task, Action, Result)을 활용해 보세요.
                </span>
              </div>

              <textarea
                className="min-h-[300px] w-full flex-1 resize-none rounded-lg border-none bg-slate-50 p-6 text-lg leading-relaxed text-slate-900 outline-none placeholder:text-slate-300 focus:ring-2 focus:ring-primary/20 dark:bg-white/5 dark:text-slate-100 dark:placeholder:text-slate-500"
                placeholder="여기에 답변을 작성해 보세요... 예: 이 프로젝트에서는 비동기 사이드 이펙트가 많아 마이크로서비스 아키텍처를 선택했고..."
                value={activeAnswer}
                onChange={(e) => {
                  if (!activeQuestionId) return;
                  const v = e.target.value;
                  setAnswersByQuestion((prev) => ({ ...prev, [activeQuestionId]: v }));
                }}
              />

              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="p-2 text-slate-400 transition-colors hover:text-primary dark:text-slate-500"
                    aria-label="음성 입력"
                  >
                    <span className="material-symbols-outlined">mic</span>
                  </button>
                  <button
                    type="button"
                    className="p-2 text-slate-400 transition-colors hover:text-primary dark:text-slate-500"
                    aria-label="목차"
                  >
                    <span className="material-symbols-outlined">
                      format_list_bulleted
                    </span>
                  </button>
                  <button
                    type="button"
                    className="p-2 text-slate-400 transition-colors hover:text-primary dark:text-slate-500"
                    aria-label="코드"
                  >
                    <span className="material-symbols-outlined">code</span>
                  </button>
                </div>

                <button
                  type="button"
                  className="flex items-center gap-2 rounded-lg bg-primary px-8 py-3 font-bold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={!activeQuestionId || isBusy}
                  onClick={() => void onCreateFeedback()}
                >
                  <span className="material-symbols-outlined">auto_fix_high</span>
                  {createFeedback.isPending ? "피드백 생성 중..." : "AI 피드백 받기"}
                </button>
              </div>
            </div>

            <div className="border-t border-slate-100 bg-slate-50 p-6 dark:border-white/5 dark:bg-white/5">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200">
                  <span className="material-symbols-outlined text-green-500">
                    check_circle
                  </span>
                  AI 평가
                </h4>
                <div className="flex gap-1">
                  <div className="size-2 rounded-full bg-green-500" />
                  <div className="size-2 rounded-full bg-yellow-400" />
                  <div className="size-2 rounded-full bg-slate-300" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-tighter text-green-600">
                    잘한 점
                  </p>
                  <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    {activeFeedback?.strengths?.length ? (
                      activeFeedback.strengths.map((s, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-xs text-green-500">
                            done
                          </span>
                          {s}
                        </li>
                      ))
                    ) : (
                      <li className="text-slate-400 dark:text-slate-500">
                        아직 피드백이 없어요.
                      </li>
                    )}
                  </ul>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-tighter text-amber-600">
                    개선할 점
                  </p>
                  <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    {activeFeedback?.improvements?.length ? (
                      activeFeedback.improvements.map((s, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-xs text-amber-500">
                            info
                          </span>
                          {s}
                        </li>
                      ))
                    ) : (
                      <li className="text-slate-400 dark:text-slate-500">
                        아직 피드백이 없어요.
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-primary/10 bg-primary/5 p-4 dark:border-white/10 dark:bg-white/5">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-tighter text-primary">
                  AI 개선 예시 답변
                </p>
                <p className="text-sm italic leading-relaxed text-slate-700 dark:text-slate-300">
                  {activeFeedback?.suggestedAnswer
                    ? activeFeedback.suggestedAnswer
                    : "피드백을 생성하면 개선 예시 답변이 표시됩니다."}
                </p>
              </div>
              {createFeedback.error ? (
                <p className="mt-4 text-sm font-semibold text-red-600 dark:text-red-400">
                  피드백 오류:{" "}
                  {createFeedback.error instanceof Error
                    ? createFeedback.error.message
                    : String(createFeedback.error)}
                </p>
              ) : null}
            </div>
          </div>
        </section>
      </div>

      <section className="mt-4 flex flex-wrap items-center justify-between gap-6 rounded-xl border border-primary/10 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-white/5">
        <div className="flex items-center gap-8">
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              시도한 질문
            </span>
            <span className="text-2xl font-black text-primary">
              {attemptedCount.toString().padStart(2, "0")} /{" "}
              {totalCount.toString().padStart(2, "0")}
            </span>
          </div>
          <div className="h-10 w-[1px] bg-slate-200 dark:bg-white/10" />
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              피드백 상태
            </span>
            <span className="text-2xl font-black text-green-500">
              {isBusy ? "진행 중" : "대기"}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-300"
            disabled
          >
            <span className="material-symbols-outlined">download</span>
            연습 기록 내보내기
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 font-bold text-white transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={!questions.length}
            onClick={() => {
              if (!questions.length) return;
              const idx = questions.findIndex((q) => q.id === activeQuestionId);
              const next = questions[(idx + 1) % questions.length];
              setActiveQuestionId(next.id);
            }}
          >
            <span className="material-symbols-outlined">navigate_next</span>
            다음 연습 세션
          </button>
        </div>
      </section>
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
    <div
      className={[
        "group cursor-pointer rounded-lg bg-white p-4 shadow-sm transition-all hover:shadow-md dark:bg-white/5",
        "border-l-4",
        active ? "border-primary" : "border-slate-200 dark:border-white/10",
      ].join(" ")}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick?.();
      }}
    >
      <div className="mb-2 flex items-start justify-between">
        <span
          className={[
            "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
            badgeTone === "primary"
              ? "bg-primary text-white"
              : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300",
          ].join(" ")}
        >
          {badge}
        </span>
        <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
          <span className="material-symbols-outlined text-xs">trending_up</span>
          출제 확률: {likelihood}%
        </span>
      </div>
      <p className="text-sm font-semibold text-slate-900 transition-colors group-hover:text-primary dark:text-slate-100">
        {text}
      </p>
    </div>
  );
}


