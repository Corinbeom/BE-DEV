import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteResumeFile,
  listResumeFiles,
  uploadResumeFile,
} from "../api/resumeFileApi";

const RESUME_FILES_KEY = ["resumeFiles"] as const;

export function useResumeFiles() {
  return useQuery({
    queryKey: RESUME_FILES_KEY,
    queryFn: listResumeFiles,
  });
}

export function useUploadResumeFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadResumeFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESUME_FILES_KEY });
    },
  });
}

export function useDeleteResumeFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteResumeFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESUME_FILES_KEY });
    },
  });
}
