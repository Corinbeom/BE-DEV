import { useQuery } from "@tanstack/react-query";
import { generateSessionReport, getResumeSession } from "../api/resumeSessionApi";

export function useResumeSession(sessionId: number | null) {
  return useQuery({
    queryKey: ["resumeSession", sessionId],
    queryFn: () => getResumeSession(sessionId as number),
    enabled: typeof sessionId === "number",
    staleTime: 0,
  });
}

/**
 * 세션 AI 회고 리포트를 로드/생성합니다.
 * POST API를 queryFn으로 사용하므로 캐시에 저장되어
 * 컴포넌트 remount 시에도 상태를 잃지 않습니다.
 */
export function useSessionReport(sessionId: number) {
  return useQuery({
    queryKey: ["sessionReport", sessionId],
    queryFn: () => generateSessionReport(sessionId),
    staleTime: Infinity,
    retry: 1,
  });
}

