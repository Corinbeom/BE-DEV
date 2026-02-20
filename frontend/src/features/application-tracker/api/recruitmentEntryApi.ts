import { apiFetch, type ApiResponse } from "@/lib/api";
import type { RecruitmentEntry, RecruitmentStep } from "./types";

export async function listRecruitmentEntriesByMember(memberId: number) {
  const res = await apiFetch<ApiResponse<RecruitmentEntry[]>>(
    `/api/recruitment-entries/by-member/${memberId}`,
  );
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? "지원 목록 조회에 실패했습니다.");
  }
  return res.data;
}

export async function createRecruitmentEntry(input: {
  memberId: number;
  companyName: string;
  position: string;
  step?: RecruitmentStep;
  appliedDate?: string | null; // yyyy-MM-dd
}) {
  const res = await apiFetch<ApiResponse<RecruitmentEntry>>("/api/recruitment-entries", {
    method: "POST",
    body: JSON.stringify({
      memberId: input.memberId,
      companyName: input.companyName,
      position: input.position,
      step: input.step ?? "APPLIED",
      platformType: "MANUAL",
      externalId: null,
      appliedDate: input.appliedDate ?? null,
    }),
  });

  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? "지원 생성에 실패했습니다.");
  }
  return res.data;
}

export async function updateRecruitmentEntryStep(input: {
  id: number;
  step: RecruitmentStep;
}) {
  const res = await apiFetch<ApiResponse<RecruitmentEntry>>(
    `/api/recruitment-entries/${input.id}/step`,
    {
      method: "PATCH",
      body: JSON.stringify({ step: input.step }),
    },
  );

  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? "단계 변경에 실패했습니다.");
  }
  return res.data;
}

export async function updateRecruitmentEntry(input: {
  id: number;
  companyName: string;
  position: string;
  step: RecruitmentStep;
  externalId: string | null;
  appliedDate: string | null; // yyyy-MM-dd
}) {
  const res = await apiFetch<ApiResponse<RecruitmentEntry>>(
    `/api/recruitment-entries/${input.id}`,
    {
      method: "PUT",
      body: JSON.stringify({
        companyName: input.companyName,
        position: input.position,
        step: input.step,
        platformType: "MANUAL",
        externalId: input.externalId,
        appliedDate: input.appliedDate,
      }),
    },
  );

  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? "지원 수정에 실패했습니다.");
  }
  return res.data;
}


