"use client";

import { useMemo, useState } from "react";
import { useDevMemberId } from "@/features/member/hooks/useDevMemberId";
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

const TOPICS: { id: CsQuizTopic; label: string }[] = [
  { id: "OS", label: "운영체제" },
  { id: "NETWORK", label: "네트워크" },
  { id: "DB", label: "데이터베이스" },
  { id: "SPRING", label: "Spring" },
  { id: "JAVA", label: "Java" },
  { id: "DATA_STRUCTURE", label: "자료구조" },
  { id: "ALGORITHM", label: "알고리즘" },
  { id: "ARCHITECTURE", label: "아키텍처 설계" },
  { id: "CLOUD", label: "클라우드 설계" },
];

const DIFFICULTIES: { id: CsQuizDifficulty; label: string }[] = [
  { id: "LOW", label: "하" },
  { id: "MID", label: "중" },
  { id: "HIGH", label: "상" },
];

export function StudyQuizPracticeView() {
  const { memberId, isBootstrapping, error: memberError } = useDevMemberId();
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

  const isBusy =
    isBootstrapping || createSession.isPending || submitAttempt.isPending;

  async function onCreateSession() {
    if (!memberId) return;
    const created = await createSession.mutateAsync({
      memberId,
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
      <aside className="custom-scrollbar lg:col-span-4 lg:pr-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-white/5 dark:bg-white/5">
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              CS 퀴즈 세션 만들기
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              객관식 60% + 주관식 40%로 세션을 생성해요.
            </p>
          </div>

          {(memberError || createSession.error) && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-200">
              {memberError ??
                (createSession.error instanceof Error
                  ? createSession.error.message
                  : "세션 생성 오류")}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <div className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                난이도
              </div>
              <div className="flex gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDifficulty(d.id)}
                    className={
                      d.id === difficulty
                        ? "rounded-lg bg-primary/10 px-3 py-2 text-sm font-bold text-primary"
                        : "rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5"
                    }
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                토픽 (복수 선택)
              </div>
              <div className="grid grid-cols-2 gap-2">
                {TOPICS.map((t) => {
                  const checked = selectedTopics.includes(t.id);
                  return (
                    <label
                      key={t.id}
                      className={
                        checked
                          ? "flex cursor-pointer items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-semibold text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
                          : "flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-white/5 dark:text-slate-300 dark:hover:bg-white/5"
                      }
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setSelectedTopics((prev) =>
                            checked
                              ? prev.filter((x) => x !== t.id)
                              : [...prev, t.id],
                          );
                        }}
                      />
                      <span>{t.label}</span>
                    </label>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                최소 1개 이상 선택해 주세요.
              </p>
            </div>

            <div>
              <div className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                문항 수 (5~10)
              </div>
              <input
                type="number"
                min={5}
                max={10}
                value={questionCount}
                onChange={(e) =>
                  setQuestionCount(
                    Math.max(
                      5,
                      Math.min(10, Number(e.target.value) || 10),
                    ),
                  )
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black/20"
              />
            </div>

            <button
              type="button"
              onClick={onCreateSession}
              disabled={!memberId || selectedTopics.length === 0 || isBusy}
              className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {createSession.isPending ? "세션 생성 중…" : "세션 생성하기"}
            </button>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6 dark:border-white/5">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              문제 목록
            </h3>
            {!session ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                세션을 생성하면 문제가 표시돼요.
              </p>
            ) : (
              <div className="space-y-2">
                {questions.map((q) => {
                  const isActive = q.id === (activeQuestion?.id ?? null);
                  const attempted = Boolean(attemptByQuestion[q.id]);
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setActiveQuestionId(q.id)}
                      className={
                        isActive
                          ? "flex w-full items-start justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-left"
                          : "flex w-full items-start justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-left hover:bg-slate-50 dark:border-white/5 dark:hover:bg-white/5"
                      }
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          {q.topic} •{" "}
                          {q.type === "MULTIPLE_CHOICE" ? "객관식" : "주관식"}
                        </div>
                        <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {q.prompt}
                        </div>
                      </div>
                      <div className="shrink-0 text-xs font-bold">
                        {attempted ? (
                          <span className="rounded bg-green-100 px-2 py-0.5 text-green-700">
                            완료
                          </span>
                        ) : (
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-white/10 dark:text-slate-300">
                            대기
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </aside>

      <section className="custom-scrollbar lg:col-span-8">
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-white/5 dark:bg-white/5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                {session ? session.title : "CS 퀴즈"}
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {session
                  ? `${session.difficulty} • ${session.topics.join(", ")} • ${questions.length}문항`
                  : "세션을 생성해 시작하세요."}
              </p>
            </div>
          </div>

          {!activeQuestion ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-white/5 dark:bg-white/5 dark:text-slate-300">
              아직 문제가 없습니다.
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-slate-200 p-5 dark:border-white/5">
                <div className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                  {activeQuestion.topic} •{" "}
                  {activeQuestion.type === "MULTIPLE_CHOICE"
                    ? "객관식"
                    : "주관식"}
                </div>
                <div className="text-base font-semibold leading-relaxed text-slate-900 dark:text-slate-100">
                  {activeQuestion.prompt}
                </div>
              </div>

              {activeQuestion.type === "MULTIPLE_CHOICE" ? (
                <div className="mt-4 space-y-3">
                  {activeQuestion.choices.map((c, idx) => (
                    <label
                      key={idx}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4 hover:bg-slate-50 dark:border-white/5 dark:hover:bg-white/5"
                    >
                      <input
                        type="radio"
                        name={`q-${activeQuestion.id}`}
                        checked={
                          mcqSelectedIndexByQuestion[activeQuestion.id] === idx
                        }
                        onChange={() =>
                          setMcqSelectedIndexByQuestion((prev) => ({
                            ...prev,
                            [activeQuestion.id]: idx,
                          }))
                        }
                      />
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {c}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="mt-4">
                  <textarea
                    value={saAnswerByQuestion[activeQuestion.id] ?? ""}
                    onChange={(e) =>
                      setSaAnswerByQuestion((prev) => ({
                        ...prev,
                        [activeQuestion.id]: e.target.value,
                      }))
                    }
                    placeholder="답변을 작성해 주세요."
                    rows={6}
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-900 dark:border-white/10 dark:bg-black/20 dark:text-slate-100"
                  />
                </div>
              )}

              <div className="mt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={
                    !activeQuestion ||
                    submitAttempt.isPending ||
                    (activeQuestion.type === "MULTIPLE_CHOICE" &&
                      typeof mcqSelectedIndexByQuestion[activeQuestion.id] !==
                        "number") ||
                    (activeQuestion.type === "SHORT_ANSWER" &&
                      !(saAnswerByQuestion[activeQuestion.id] ?? "").trim())
                  }
                  className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {submitAttempt.isPending
                    ? "제출 중…"
                    : "제출하고 피드백 받기"}
                </button>
              </div>

              {(submitAttempt.error instanceof Error ||
                attemptByQuestion[activeQuestion.id]) && (
                <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-white/5 dark:bg-white/5">
                  {submitAttempt.error instanceof Error ? (
                    <div className="text-sm text-red-700 dark:text-red-200">
                      {submitAttempt.error.message}
                    </div>
                  ) : null}

                  {attemptByQuestion[activeQuestion.id] ? (
                    <FeedbackPanel
                      attempt={attemptByQuestion[activeQuestion.id] as CsQuizAttempt}
                    />
                  ) : null}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function FeedbackPanel({ attempt }: { attempt: CsQuizAttempt }) {
  return (
    <div className="space-y-4">
      {typeof attempt.correct === "boolean" ? (
        <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
          채점 결과: {attempt.correct ? "정답" : "오답"}
        </div>
      ) : null}

      <div>
        <div className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Strengths
        </div>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-200">
          {(attempt.strengths ?? []).map((s, i) => (
            <li key={i}>{s}</li>
          ))}
          {attempt.strengths.length === 0 ? <li>표시할 내용이 없습니다.</li> : null}
        </ul>
      </div>

      <div>
        <div className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Improvements
        </div>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-200">
          {(attempt.improvements ?? []).map((s, i) => (
            <li key={i}>{s}</li>
          ))}
          {attempt.improvements.length === 0 ? <li>표시할 내용이 없습니다.</li> : null}
        </ul>
      </div>

      <div>
        <div className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Suggested Answer
        </div>
        <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">
          {attempt.suggestedAnswer ?? "(없음)"}
        </p>
      </div>

      <div>
        <div className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Follow-ups
        </div>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-200">
          {(attempt.followups ?? []).map((s, i) => (
            <li key={i}>{s}</li>
          ))}
          {attempt.followups.length === 0 ? <li>표시할 내용이 없습니다.</li> : null}
        </ul>
      </div>
    </div>
  );
}

