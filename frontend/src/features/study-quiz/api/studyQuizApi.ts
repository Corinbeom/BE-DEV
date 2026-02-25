import { apiFetch, type ApiResponse } from "@/lib/api";
import type { CsQuizAttempt, CsQuizDifficulty, CsQuizSession, CsQuizTopic } from "./types";

export async function createCsQuizSession(input: {
  memberId: number;
  difficulty: CsQuizDifficulty;
  topics: CsQuizTopic[];
  questionCount: number; // 5~10
  title?: string;
}) {
  const res = await apiFetch<ApiResponse<CsQuizSession>>("/api/cs-quiz-sessions", {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? "CS 퀴즈 세션 생성에 실패했습니다.");
  }
  return res.data;
}

export async function getCsQuizSession(sessionId: number) {
  const res = await apiFetch<ApiResponse<CsQuizSession>>(
    `/api/cs-quiz-sessions/${sessionId}`,
  );
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? "CS 퀴즈 세션 조회에 실패했습니다.");
  }
  return res.data;
}

export async function submitCsQuizAttempt(input: {
  questionId: number;
  selectedChoiceIndex?: number | null;
  answerText?: string | null;
}) {
  const res = await apiFetch<ApiResponse<CsQuizAttempt>>(
    `/api/cs-quiz-questions/${input.questionId}/attempts`,
    {
      method: "POST",
      body: JSON.stringify({
        selectedChoiceIndex: input.selectedChoiceIndex ?? null,
        answerText: input.answerText ?? null,
      }),
    },
  );
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? "답안 제출에 실패했습니다.");
  }
  return res.data;
}

