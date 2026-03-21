import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCsQuizSession, deleteCsQuizSession, submitCsQuizAttempt } from "../api/studyQuizApi";

export function useCreateCsQuizSession() {
  return useMutation({
    mutationFn: createCsQuizSession,
  });
}

export function useSubmitCsQuizAttempt() {
  return useMutation({
    mutationFn: submitCsQuizAttempt,
  });
}

export function useDeleteCsQuizSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCsQuizSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["csQuizSessions"] });
    },
  });
}

