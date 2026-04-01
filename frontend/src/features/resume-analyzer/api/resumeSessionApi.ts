import { apiFetch, type ApiResponse } from "@/lib/api";
import type {
  PositionType,
  ResumeFeedback,
  ResumeInterviewStats,
  ResumeSession,
} from "./types";

export async function createResumeSession(input: {
  positionType: PositionType;
  resumeId: number;
  portfolioResumeId?: number | null;
  portfolioUrl?: string | null;
  title?: string;
  targetTechnologies?: string[];
}) {
  const res = await apiFetch<ApiResponse<ResumeSession>>(
    "/api/resume-sessions",
    {
      method: "POST",
      body: JSON.stringify({
        positionType: input.positionType,
        resumeId: input.resumeId,
        portfolioResumeId: input.portfolioResumeId ?? null,
        portfolioUrl: input.portfolioUrl ?? null,
        title: input.title ?? null,
        targetTechnologies: input.targetTechnologies ?? [],
      }),
    },
  );
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? "세션 생성에 실패했습니다.");
  }
  return res.data;
}

export async function listResumeSessions() {
  const res = await apiFetch<ApiResponse<ResumeSession[]>>("/api/resume-sessions");
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? "이력서 세션 목록 조회에 실패했습니다.");
  }
  return res.data;
}

export async function getResumeSession(sessionId: number) {
  const res = await apiFetch<ApiResponse<ResumeSession>>(
    `/api/resume-sessions/${sessionId}`,
  );
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? "세션 조회에 실패했습니다.");
  }
  return res.data;
}

export async function deleteResumeSession(sessionId: number) {
  const res = await apiFetch<ApiResponse<null>>(
    `/api/resume-sessions/${sessionId}`,
    { method: "DELETE" },
  );
  if (!res.success) {
    throw new Error(res.error?.message ?? "이력서 세션 삭제에 실패했습니다.");
  }
}

export async function getResumeInterviewStats() {
  const res = await apiFetch<ApiResponse<ResumeInterviewStats>>(
    "/api/resume-sessions/stats",
  );
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? "면접 통계 조회에 실패했습니다.");
  }
  return res.data;
}

export async function createResumeFeedback(input: {
  questionId: number;
  answerText: string;
}) {
  const res = await apiFetch<ApiResponse<ResumeFeedback>>(
    `/api/resume-questions/${input.questionId}/feedback`,
    {
      method: "POST",
      body: JSON.stringify({ answerText: input.answerText }),
    },
  );
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? "피드백 생성에 실패했습니다.");
  }
  return res.data;
}
