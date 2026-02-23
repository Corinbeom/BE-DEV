import { useQuery } from "@tanstack/react-query";
import { getResumeSession } from "../api/resumeSessionApi";

export function useResumeSession(sessionId: number | null) {
  return useQuery({
    queryKey: ["resumeSession", sessionId],
    queryFn: () => getResumeSession(sessionId as number),
    enabled: typeof sessionId === "number",
    staleTime: 0,
  });
}

