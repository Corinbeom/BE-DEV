import { useMutation } from "@tanstack/react-query";
import { createCsQuizSession, submitCsQuizAttempt } from "../api/studyQuizApi";

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

