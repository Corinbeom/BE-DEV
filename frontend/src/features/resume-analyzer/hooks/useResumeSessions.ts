"use client";

import { useQuery } from "@tanstack/react-query";
import { listResumeSessions } from "../api/resumeSessionApi";

export function useResumeSessions() {
  return useQuery({
    queryKey: ["resumeSessions"],
    queryFn: listResumeSessions,
  });
}
