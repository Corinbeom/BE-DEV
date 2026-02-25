import { useQuery } from "@tanstack/react-query";
import { getCsQuizSession } from "../api/studyQuizApi";

export function useCsQuizSession(sessionId: number | null) {
  return useQuery({
    queryKey: ["csQuizSession", sessionId],
    queryFn: () => getCsQuizSession(sessionId as number),
    enabled: typeof sessionId === "number",
    staleTime: 0,
  });
}

