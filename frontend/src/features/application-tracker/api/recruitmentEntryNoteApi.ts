import { apiFetch, type ApiResponse } from "@/lib/api";
import type { RecruitmentEntryNote } from "./types";

export async function listRecruitmentEntryNotes(entryId: number) {
  const res = await apiFetch<ApiResponse<RecruitmentEntryNote[]>>(
    `/api/recruitment-entries/${entryId}/notes`,
  );
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? "메모 목록 조회에 실패했습니다.");
  }
  return res.data;
}

export async function createRecruitmentEntryNote(entryId: number, content: string) {
  const res = await apiFetch<ApiResponse<RecruitmentEntryNote>>(
    `/api/recruitment-entries/${entryId}/notes`,
    {
      method: "POST",
      body: JSON.stringify({ content }),
    },
  );
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? "메모 생성에 실패했습니다.");
  }
  return res.data;
}

export async function updateRecruitmentEntryNote(
  entryId: number,
  noteId: number,
  content: string,
) {
  const res = await apiFetch<ApiResponse<RecruitmentEntryNote>>(
    `/api/recruitment-entries/${entryId}/notes/${noteId}`,
    {
      method: "PUT",
      body: JSON.stringify({ content }),
    },
  );
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? "메모 수정에 실패했습니다.");
  }
  return res.data;
}

export async function deleteRecruitmentEntryNote(entryId: number, noteId: number) {
  const res = await apiFetch<ApiResponse<void>>(
    `/api/recruitment-entries/${entryId}/notes/${noteId}`,
    { method: "DELETE" },
  );
  if (!res.success) {
    throw new Error(res.error?.message ?? "메모 삭제에 실패했습니다.");
  }
}


