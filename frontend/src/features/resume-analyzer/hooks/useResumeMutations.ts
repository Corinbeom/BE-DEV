import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createResumeFeedback, createResumeSession, deleteResumeSession } from "../api/resumeSessionApi";

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

