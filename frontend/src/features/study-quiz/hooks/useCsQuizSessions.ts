"use client";

import { useQuery } from "@tanstack/react-query";
import { listCsQuizSessions } from "../api/studyQuizApi";

export function useCsQuizSessions() {
  return useQuery({
    queryKey: ["csQuizSessions"],
    queryFn: listCsQuizSessions,
  });
}
