"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCoachAnalysis,
  getCoachSummary,
  refreshCoachAnalysis,
} from "../api/coachApi";

export function useCoachSummary() {
  return useQuery({
    queryKey: ["coachSummary"],
    queryFn: getCoachSummary,
  });
}

export function useCoachAnalysis() {
  return useQuery({
    queryKey: ["coachAnalysis"],
    queryFn: getCoachAnalysis,
  });
}

export function useRefreshCoachAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: refreshCoachAnalysis,
    onSuccess: (data) => {
      queryClient.setQueryData(["coachAnalysis"], data);
      queryClient.invalidateQueries({ queryKey: ["coachSummary"] });
    },
  });
}
