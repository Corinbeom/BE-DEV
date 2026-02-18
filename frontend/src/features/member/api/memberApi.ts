import { apiFetch, type ApiResponse } from "@/lib/api";
import type { Member } from "./types";

export async function createMember(email: string) {
  const res = await apiFetch<ApiResponse<Member>>("/api/members", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? "멤버 생성에 실패했습니다.");
  }
  return res.data;
}


