"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useResumeFiles } from "../hooks/useResumeFiles";
import {
  useInterviewMailSchedule,
  useUpsertInterviewMailSchedule,
  useDeleteInterviewMailSchedule,
  useSendTestInterviewMail,
} from "../hooks/useInterviewMailSchedule";
import type { InterviewMailSchedule, ResumeFile } from "../api/types";

const POSITION_TYPES = ["BE", "FE", "MOBILE"] as const;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function InterviewMailScheduleCard() {
  const { data: schedule, isLoading } = useInterviewMailSchedule();
  const { data: files } = useResumeFiles();

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
          불러오는 중...
        </div>
      </div>
    );
  }

  return (
    <ScheduleForm
      key={schedule?.resumeId ?? "new"}
      schedule={schedule ?? undefined}
      extractedFiles={files?.filter((f) => f.extractStatus === "EXTRACTED") ?? []}
    />
  );
}

function ScheduleForm({
  schedule,
  extractedFiles,
}: {
  schedule: InterviewMailSchedule | undefined;
  extractedFiles: ResumeFile[];
}) {
  const upsertMutation = useUpsertInterviewMailSchedule();
  const deleteMutation = useDeleteInterviewMailSchedule();
  const testMutation = useSendTestInterviewMail();

  const [resumeId, setResumeId] = useState<number | "">(schedule?.resumeId ?? "");
  const [positionType, setPositionType] = useState(schedule?.positionType ?? "BE");
  const [sendHour, setSendHour] = useState(schedule?.sendHour ?? 9);
  const [enabled, setEnabled] = useState(schedule?.enabled ?? true);
  const [techInput, setTechInput] = useState(schedule?.targetTechnologies.join(", ") ?? "");

  function onSave() {
    if (!resumeId) {
      toast.error("이력서를 선택해주세요.");
      return;
    }
    const targetTechnologies = techInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    upsertMutation.mutate(
      { resumeId: Number(resumeId), positionType, sendHour, enabled, targetTechnologies },
      {
        onSuccess: () => toast.success("스케줄이 저장되었습니다."),
        onError: (err) => toast.error(err instanceof Error ? err.message : "저장에 실패했습니다."),
      }
    );
  }

  function onDelete() {
    if (!confirm("메일 스케줄을 삭제하시겠습니까?")) return;
    deleteMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("스케줄이 삭제되었습니다.");
        setResumeId("");
        setPositionType("BE");
        setSendHour(9);
        setEnabled(true);
        setTechInput("");
      },
      onError: (err) => toast.error(err instanceof Error ? err.message : "삭제에 실패했습니다."),
    });
  }

  function onTestSend() {
    testMutation.mutate(undefined, {
      onSuccess: () => toast.success("테스트 메일이 발송되었습니다."),
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "테스트 발송에 실패했습니다."),
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600">
          <span className="material-symbols-outlined text-[18px]">schedule_send</span>
        </div>
        <h3 className="text-[15px] font-bold text-foreground">면접 질문 자동 메일</h3>
        {schedule && (
          <span
            className={cn(
              "ml-auto rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold",
              schedule.enabled
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            )}
          >
            {schedule.enabled ? "활성" : "비활성"}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {/* 3-col selects */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              이력서
            </span>
            <select
              className="w-full rounded-lg border border-input bg-background p-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/20"
              value={resumeId}
              onChange={(e) => setResumeId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">선택해주세요</option>
              {extractedFiles.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.title} ({f.originalFilename})
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              직무 유형
            </span>
            <select
              className="w-full rounded-lg border border-input bg-background p-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/20"
              value={positionType}
              onChange={(e) => setPositionType(e.target.value)}
            >
              {POSITION_TYPES.map((pt) => (
                <option key={pt} value={pt}>{pt}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              발송 시간 (KST)
            </span>
            <select
              className="w-full rounded-lg border border-input bg-background p-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/20"
              value={sendHour}
              onChange={(e) => setSendHour(Number(e.target.value))}
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
              ))}
            </select>
          </label>
        </div>

        {/* Tech stack */}
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            기술 스택 (선택, 쉼표 구분)
          </span>
          <Input
            placeholder="예: Spring, JPA, React"
            value={techInput}
            onChange={(e) => setTechInput(e.target.value)}
          />
        </label>

        {/* Enable toggle */}
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="size-4 rounded border-input accent-primary"
          />
          <span className="text-sm font-medium text-foreground">자동 발송 활성화</span>
        </label>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          <Button className="gap-2" disabled={upsertMutation.isPending} onClick={onSave}>
            {upsertMutation.isPending ? (
              <>
                <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                저장 중...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">save</span>
                저장
              </>
            )}
          </Button>

          <Button
            variant="outline"
            className="gap-2"
            disabled={!schedule || testMutation.isPending}
            onClick={onTestSend}
          >
            {testMutation.isPending ? (
              <>
                <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                발송 중...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">send</span>
                테스트 메일 발송
              </>
            )}
          </Button>

          {schedule && (
            <Button
              variant="ghost"
              className="gap-2 text-destructive hover:text-destructive"
              disabled={deleteMutation.isPending}
              onClick={onDelete}
            >
              <span className="material-symbols-outlined text-sm">delete</span>
              삭제
            </Button>
          )}
        </div>

        {extractedFiles.length === 0 && (
          <p className="text-sm text-muted-foreground">
            텍스트 추출이 완료된 이력서가 없습니다. 먼저 이력서를 업로드해주세요.
          </p>
        )}
      </div>
    </div>
  );
}
