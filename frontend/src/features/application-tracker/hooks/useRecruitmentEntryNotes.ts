"use client";

import { useQuery } from "@tanstack/react-query";
import { listRecruitmentEntryNotes } from "../api/recruitmentEntryNoteApi";

export function useRecruitmentEntryNotes(entryId: number | null, enabled: boolean) {
  return useQuery({
    queryKey: ["recruitmentEntryNotes", entryId],
    queryFn: async () => {
      if (!entryId) return [];
      return await listRecruitmentEntryNotes(entryId);
    },
    enabled: enabled && !!entryId,
  });
}


