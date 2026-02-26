import { apiBaseUrl, apiFetch, type ApiResponse } from "@/lib/api";
import type { PositionType, ResumeFeedback, ResumeSession } from "./types";

export async function createResumeSession(input: {
  positionType: PositionType;
  title?: string;
  resumeFile: File;
  portfolioFile?: File | null;
  portfolioUrl?: string | null;
}) {
  const form = new FormData();
  form.append("positionType", input.positionType);
  if (input.title) form.append("title", input.title);
  if (input.portfolioUrl) form.append("portfolioUrl", input.portfolioUrl);
  form.append("resumeFile", input.resumeFile);
  if (input.portfolioFile) form.append("portfolioFile", input.portfolioFile);

  const res = await fetch(`${apiBaseUrl()}/api/resume-sessions`, {
    method: "POST",
    body: form,
    credentials: "include",
    cache: "no-store",
  });

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("UNAUTHORIZED");
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }

  const json = (await res.json()) as ApiResponse<ResumeSession>;
  if (!json.success || !json.data) {
    throw new Error(json.error?.message ?? "세션 생성에 실패했습니다.");
  }
  return json.data;
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
