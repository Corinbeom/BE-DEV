import { apiBaseUrl, apiFetch, type ApiResponse } from "@/lib/api";
import type { AuthUser } from "../types";

export async function getMe(): Promise<AuthUser> {
  const res = await apiFetch<ApiResponse<AuthUser>>("/api/auth/me");
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? "사용자 정보를 불러오지 못했습니다.");
  }
  return res.data;
}

export async function logout(): Promise<void> {
  await fetch(`${apiBaseUrl()}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
    cache: "no-store",
  });

  // Fallback: HTTP 환경에서 Secure 쿠키 삭제가 안 될 수 있으므로 직접 만료
  document.cookie = "devweb_token=; Max-Age=0; Path=/;";
}
