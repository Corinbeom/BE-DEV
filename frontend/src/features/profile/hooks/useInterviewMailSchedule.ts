import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteInterviewMailSchedule,
  getInterviewMailSchedule,
  sendTestInterviewMail,
  upsertInterviewMailSchedule,
} from "../api/interviewMailApi";
import type { UpsertInterviewMailScheduleInput } from "../api/types";

const SCHEDULE_KEY = ["interviewMailSchedule"] as const;

export function useInterviewMailSchedule() {
  return useQuery({
    queryKey: SCHEDULE_KEY,
    queryFn: getInterviewMailSchedule,
  });
}

export function useUpsertInterviewMailSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpsertInterviewMailScheduleInput) =>
      upsertInterviewMailSchedule(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHEDULE_KEY });
    },
  });
}

export function useDeleteInterviewMailSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteInterviewMailSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHEDULE_KEY });
    },
  });
}

export function useSendTestInterviewMail() {
  return useMutation({
    mutationFn: sendTestInterviewMail,
  });
}
