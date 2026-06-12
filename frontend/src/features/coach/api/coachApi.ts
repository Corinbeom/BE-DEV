import { apiFetch, type ApiResponse } from "@/lib/api";
import type { CoachAnalysis, CoachSummary } from "./types";

export async function getCoachSummary() {
  const res = await apiFetch<ApiResponse<CoachSummary>>("/api/coach/summary");
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? "코치 요약 조회에 실패했습니다.");
  }
  return res.data;
}

export async function getCoachAnalysis() {
  const res = await apiFetch<ApiResponse<CoachAnalysis>>("/api/coach/analysis");
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? "코치 분석 조회에 실패했습니다.");
  }
  return res.data;
}

export async function refreshCoachAnalysis() {
  const res = await apiFetch<ApiResponse<CoachAnalysis>>("/api/coach/refresh", {
    method: "POST",
  });
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? "코치 분석 새로고침에 실패했습니다.");
  }
  return res.data;
}
