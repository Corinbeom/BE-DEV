"use client";

import { useQuery } from "@tanstack/react-query";
import { getCoachingReport } from "../api/resumeSessionApi";

export function useCoachingReport() {
  return useQuery({
    queryKey: ["coachingReport"],
    queryFn: getCoachingReport,
  });
}
