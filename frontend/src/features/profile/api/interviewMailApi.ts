import { apiFetch, type ApiResponse } from "@/lib/api";
import type { InterviewMailSchedule, UpsertInterviewMailScheduleInput } from "./types";

export async function getInterviewMailSchedule(): Promise<InterviewMailSchedule | null> {
  const res = await apiFetch<ApiResponse<InterviewMailSchedule | null>>(
    "/api/interview-mail-schedule",
  );
  if (!res.success) {
    throw new Error(res.error?.message ?? "스케줄 조회에 실패했습니다.");
  }
  return res.data ?? null;
}

export async function upsertInterviewMailSchedule(
  input: UpsertInterviewMailScheduleInput,
): Promise<InterviewMailSchedule> {
  const res = await apiFetch<ApiResponse<InterviewMailSchedule>>(
    "/api/interview-mail-schedule",
    {
      method: "PUT",
      body: JSON.stringify(input),
    },
  );
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? "스케줄 저장에 실패했습니다.");
  }
  return res.data;
}

export async function deleteInterviewMailSchedule(): Promise<void> {
  const res = await apiFetch<ApiResponse<void>>(
    "/api/interview-mail-schedule",
    { method: "DELETE" },
  );
  if (!res.success) {
    throw new Error(res.error?.message ?? "스케줄 삭제에 실패했습니다.");
  }
}

export async function sendTestInterviewMail(): Promise<void> {
  const res = await apiFetch<ApiResponse<void>>(
    "/api/interview-mail-schedule/test",
    { method: "POST" },
  );
  if (!res.success) {
    throw new Error(res.error?.message ?? "테스트 메일 발송에 실패했습니다.");
  }
}
