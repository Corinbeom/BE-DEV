import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  completeResumeSession,
  createResumeFeedback,
  createResumeSession,
  deleteResumeSession,
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
