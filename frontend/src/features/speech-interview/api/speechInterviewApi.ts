import { apiFetch, type ApiResponse } from "@/lib/api";
import type { SpeechInterviewSession, SubmitAnswerRequest } from "./types";

function unwrap<T>(res: ApiResponse<T>): T {
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? "API 오류가 발생했습니다.");
  }
  return res.data;
}

export async function createSpeechInterview(
  resumeSessionId: number,
  useCamera: boolean
): Promise<SpeechInterviewSession> {
  const res = await apiFetch<ApiResponse<SpeechInterviewSession>>("/api/speech-interviews", {
    method: "POST",
    body: JSON.stringify({ resumeSessionId, useCamera }),
  });
  return unwrap(res);
}

export async function submitSpeechAnswer(
  sessionId: number,
  body: SubmitAnswerRequest
): Promise<SpeechInterviewSession> {
  const res = await apiFetch<ApiResponse<SpeechInterviewSession>>(
    `/api/speech-interviews/${sessionId}/answers`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
  return unwrap(res);
}

export async function completeSpeechInterview(
  sessionId: number
): Promise<SpeechInterviewSession> {
  const res = await apiFetch<ApiResponse<SpeechInterviewSession>>(
    `/api/speech-interviews/${sessionId}/complete`,
    { method: "POST" }
  );
  return unwrap(res);
}

export async function listSpeechInterviews(): Promise<SpeechInterviewSession[]> {
  const res = await apiFetch<ApiResponse<SpeechInterviewSession[]>>("/api/speech-interviews");
  return unwrap(res);
}

export async function getSpeechInterview(
  sessionId: number
): Promise<SpeechInterviewSession> {
  const res = await apiFetch<ApiResponse<SpeechInterviewSession>>(
    `/api/speech-interviews/${sessionId}`
  );
  return unwrap(res);
}
