"use client";

import { useQuery } from "@tanstack/react-query";
import { getCsQuizStats } from "../api/studyQuizApi";

export function useCsQuizStats() {
  return useQuery({
    queryKey: ["csQuizStats"],
    queryFn: getCsQuizStats,
  });
}
