"use client";

import { useQuery } from "@tanstack/react-query";
import { listRecruitmentEntriesByMember } from "../api/recruitmentEntryApi";

export function useRecruitmentEntries() {
  return useQuery({
    queryKey: ["recruitmentEntries"],
    queryFn: () => listRecruitmentEntriesByMember(),
  });
}
