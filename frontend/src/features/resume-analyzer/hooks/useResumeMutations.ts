import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  completeResumeSession,
  createResumeFeedback,
  createResumeSession,
  deleteResumeSession,
  generateSessionReport,
} from "../api/resumeSessionApi";

export function useCreateResumeSession() {
  return useMutation({
    mutationFn: createResumeSession,
  });
}

export function useCreateResumeFeedback() {
  return useMutation({
    mutationFn: createResumeFeedback,
  });
}

export function useDeleteResumeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteResumeSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resumeSessions"] });
    },
  });
}

export function useCompleteResumeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: completeResumeSession,
    onSuccess: (session) => {
      queryClient.setQueryData(["resumeSession", session.id], session);
      queryClient.invalidateQueries({ queryKey: ["resumeSessions"] });
    },
  });
}

export function useGenerateSessionReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: generateSessionReport,
    onSuccess: () => {
      // 상세 세션 쿼리를 invalidate하면 부모가 refetch되면서 mutation 상태가
      // 초기화되어 무한 로딩으로 보인다. 목록만 갱신한다.
      queryClient.invalidateQueries({ queryKey: ["resumeSessions"] });
    },
  });
}
