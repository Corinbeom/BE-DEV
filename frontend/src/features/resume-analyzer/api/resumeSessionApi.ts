import { apiFetch, type ApiResponse } from "@/lib/api";
import type {
  CoachingReport,
  JdMatchAnalysis,
  PositionType,
  ResumeFeedback,
  ResumeInterviewStats,
  ResumeSession,
  SessionReport,
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

export async function completeResumeSession(sessionId: number) {
  const res = await apiFetch<ApiResponse<ResumeSession>>(
    `/api/resume-sessions/${sessionId}/complete`,
    { method: "POST" },
  );
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? "세션 완료 처리에 실패했습니다.");
  }
  return res.data;
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

export async function generateSessionReport(sessionId: number) {
  const res = await apiFetch<ApiResponse<SessionReport>>(
    `/api/resume-sessions/${sessionId}/report`,
    { method: "POST" },
  );
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? "AI 리포트 생성에 실패했습니다.");
  }
  return res.data;
}

export async function getSessionReport(sessionId: number) {
  const res = await apiFetch<ApiResponse<SessionReport>>(
    `/api/resume-sessions/${sessionId}/report`,
  );
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? "리포트 조회에 실패했습니다.");
  }
  return res.data;
}

export async function getCoachingReport() {
  const res = await apiFetch<ApiResponse<CoachingReport | null>>(
    "/api/resume-sessions/coaching-report",
  );
  if (!res.success) {
    throw new Error(res.error?.message ?? "코칭 리포트 조회에 실패했습니다.");
  }
  return res.data ?? null;
}

export async function generateCoachingReport() {
  const res = await apiFetch<ApiResponse<CoachingReport>>(
    "/api/resume-sessions/coaching-report",
    { method: "POST" },
  );
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? "AI 코칭 리포트 생성에 실패했습니다.");
  }
  return res.data;
}

export async function analyzeJdMatch(input: {
  resumeId: number;
  portfolioResumeId?: number | null;
  jdText: string;
}) {
  const res = await apiFetch<ApiResponse<JdMatchAnalysis>>(
    "/api/resume-sessions/jd-match",
    {
      method: "POST",
      body: JSON.stringify({
        resumeId: input.resumeId,
        portfolioResumeId: input.portfolioResumeId ?? null,
        jdText: input.jdText,
      }),
    },
  );
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? "JD 매칭 분석에 실패했습니다.");
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
