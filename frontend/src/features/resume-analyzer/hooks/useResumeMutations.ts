import { useMutation } from "@tanstack/react-query";
import { createResumeFeedback, createResumeSession } from "../api/resumeSessionApi";

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

