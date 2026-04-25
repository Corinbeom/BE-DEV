import { apiBaseUrl, apiFetch, type ApiResponse } from "@/lib/api";
import type { ResumeFile, ResumeFileType } from "./types";

export async function uploadResumeFile(input: {
  file: File;
  fileType: ResumeFileType;
  title?: string;
}): Promise<ResumeFile> {
  const form = new FormData();
  form.append("file", input.file);
  form.append("fileType", input.fileType);
  if (input.title) form.append("title", input.title);

  const res = await fetch(`${apiBaseUrl()}/api/resumes`, {
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

  const json = (await res.json()) as ApiResponse<ResumeFile>;
  if (!json.success || !json.data) {
    throw new Error(json.error?.message ?? "파일 업로드에 실패했습니다.");
  }
  return json.data;
}

export async function listResumeFiles(): Promise<ResumeFile[]> {
  const res = await apiFetch<ApiResponse<ResumeFile[]>>("/api/resumes");
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? "파일 목록 조회에 실패했습니다.");
  }
  return res.data;
}

export async function deleteResumeFile(id: number): Promise<void> {
  const res = await apiFetch<ApiResponse<void>>(`/api/resumes/${id}`, {
    method: "DELETE",
  });
  if (!res.success) {
    throw new Error(res.error?.message ?? "파일 삭제에 실패했습니다.");
  }
}

export async function fetchResumeFileBlob(id: number): Promise<Blob> {
  const res = await fetch(`${apiBaseUrl()}/api/resumes/${id}/file`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`파일을 불러올 수 없습니다. (${res.status})`);
  }
  return res.blob();
}
