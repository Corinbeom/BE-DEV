"use client";

import { useMutation } from "@tanstack/react-query";
import { analyzeJdMatch } from "../api/resumeSessionApi";

export function useJdMatchAnalysis() {
  return useMutation({
    mutationFn: analyzeJdMatch,
  });
}
