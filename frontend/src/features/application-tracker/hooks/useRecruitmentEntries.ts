"use client";

import { useQuery } from "@tanstack/react-query";
import { listRecruitmentEntriesByMember } from "../api/recruitmentEntryApi";

export function useRecruitmentEntries(memberId: number | null) {
  return useQuery({
    queryKey: ["recruitmentEntries", memberId],
    queryFn: async () => {
      if (!memberId) return [];
      return await listRecruitmentEntriesByMember(memberId);
    },
    enabled: !!memberId,
  });
}


