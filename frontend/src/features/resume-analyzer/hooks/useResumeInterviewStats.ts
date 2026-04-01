"use client";

import { useQuery } from "@tanstack/react-query";
import { getResumeInterviewStats } from "../api/resumeSessionApi";

export function useResumeInterviewStats() {
  return useQuery({
    queryKey: ["resumeInterviewStats"],
    queryFn: getResumeInterviewStats,
  });
}
