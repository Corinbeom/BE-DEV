import { apiFetch, type ApiResponse } from "@/lib/api";
import type { ChatRequest, ChatResponse, SpeechInterviewSession } from "./types";

function unwrap<T>(res: ApiResponse<T>): T {
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? "API 오류가 발생했습니다.");
  }
  return res.data;
}

export async function createSpeechInterview(
  resumeSessionId: number
): Promise<SpeechInterviewSession> {
  const res = await apiFetch<ApiResponse<SpeechInterviewSession>>("/api/speech-interviews", {
    method: "POST",
    body: JSON.stringify({ resumeSessionId, useCamera: false }),
  });
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

export async function chatWithInterviewer(
  sessionId: number,
  body: ChatRequest
): Promise<ChatResponse> {
  const res = await apiFetch<ApiResponse<ChatResponse>>(
    `/api/speech-interviews/${sessionId}/chat`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
  return unwrap(res);
}
