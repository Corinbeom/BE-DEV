"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  createRecruitmentEntry,
  updateRecruitmentEntry,
  updateRecruitmentEntryStep,
} from "../api/recruitmentEntryApi";
import {
  createRecruitmentEntryNote,
  deleteRecruitmentEntryNote,
} from "../api/recruitmentEntryNoteApi";
import type {
  PlatformType,
  RecruitmentEntry,
  RecruitmentStep,
} from "../api/types";
import { useRecruitmentEntries } from "../hooks/useRecruitmentEntries";
import { useRecruitmentEntryNotes } from "../hooks/useRecruitmentEntryNotes";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type ColumnKey = "APPLIED" | "IN_REVIEW" | "INTERVIEWING" | "FINAL";

function todayLocalISODate() {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function platformLabel(p: PlatformType) {
  switch (p) {
    case "MANUAL":
      return "직접 입력";
    case "WANTED":
      return "원티드";
    case "LINKEDIN":
      return "LinkedIn";
    case "JOBKOREA":
      return "잡코리아";
    case "SARMIN":
      return "사람인";
    case "REMEMBER":
      return "리멤버";
    case "JUMPIT":
      return "점핏";
    case "ROCKETPUNCH":
      return "로켓펀치";
    case "PROGRAMMERS":
      return "프로그래머스";
    case "ETC":
      return "기타";
  }
}

const ALL_PLATFORMS: PlatformType[] = [
  "MANUAL",
  "WANTED",
  "LINKEDIN",
  "JOBKOREA",
  "SARMIN",
  "REMEMBER",
  "JUMPIT",
  "ROCKETPUNCH",
  "PROGRAMMERS",
  "ETC",
];

function mapStepToColumn(step: RecruitmentStep): ColumnKey {
  switch (step) {
    case "READY":
    case "APPLIED":
      return "APPLIED";
    case "DOC_PASSED":
    case "TEST_PHASE":
      return "IN_REVIEW";
    case "INTERVIEWING":
      return "INTERVIEWING";
    case "OFFERED":
    case "REJECTED":
    case "ON_HOLD":
      return "FINAL";
  }
}

const COLUMN_META: Record<
  ColumnKey,
  { title: string; color: string; borderColor: string }
> = {
  APPLIED: {
    title: "지원 완료",
    color: "bg-primary/10 text-primary",
    borderColor: "border-l-primary",
  },
  IN_REVIEW: {
    title: "전형 진행",
    color: "bg-blue-500/10 text-blue-600",
    borderColor: "border-l-blue-500",
  },
  INTERVIEWING: {
    title: "면접",
    color: "bg-amber-500/10 text-amber-600",
    borderColor: "border-l-amber-500",
  },
  FINAL: {
    title: "결과",
    color: "bg-emerald-500/10 text-emerald-600",
    borderColor: "border-l-emerald-500",
  },
};

function defaultStepForColumn(key: ColumnKey): RecruitmentStep {
  switch (key) {
    case "APPLIED":
      return "APPLIED";
    case "IN_REVIEW":
      return "DOC_PASSED";
    case "INTERVIEWING":
      return "INTERVIEWING";
    case "FINAL":
      return "ON_HOLD";
  }
}

function toKoreanStep(step: RecruitmentStep) {
  switch (step) {
    case "READY":
      return "준비";
    case "APPLIED":
      return "지원";
    case "DOC_PASSED":
      return "서류 합격";
    case "TEST_PHASE":
      return "테스트";
    case "INTERVIEWING":
      return "면접";
    case "OFFERED":
      return "오퍼";
    case "REJECTED":
      return "불합격";
    case "ON_HOLD":
      return "보류";
  }
}

const statColorMap = {
  primary: {
    icon: "text-primary bg-primary/10",
    border: "border-l-primary",
  },
  amber: {
    icon: "text-amber-600 bg-amber-500/10",
    border: "border-l-amber-500",
  },
  emerald: {
    icon: "text-emerald-600 bg-emerald-500/10",
    border: "border-l-emerald-500",
  },
} as const;

export function ApplicationTrackerView() {
  const qc = useQueryClient();
  const { data: entries = [], isLoading, error } = useRecruitmentEntries();
  const [dragOver, setDragOver] = useState<ColumnKey | null>(null);
  const [selected, setSelected] = useState<RecruitmentEntry | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const grouped = useMemo(() => {
    const init: Record<ColumnKey, RecruitmentEntry[]> = {
      APPLIED: [],
      IN_REVIEW: [],
      INTERVIEWING: [],
      FINAL: [],
    };
    for (const e of entries) {
      init[mapStepToColumn(e.step)].push(e);
    }
    return init;
  }, [entries]);

  const createMutation = useMutation({
    mutationFn: async (input: {
      companyName: string;
      position: string;
      appliedDate: string | null;
      platformType: PlatformType;
    }) => {
      return await createRecruitmentEntry({
        companyName: input.companyName.trim(),
        position: input.position.trim(),
        step: "APPLIED",
        appliedDate: input.appliedDate,
        platformType: input.platformType,
      });
    },
    onSuccess: async () => {
      setIsAddOpen(false);
      await qc.invalidateQueries({ queryKey: ["recruitmentEntries"] });
    },
  });

  const stepMutation = useMutation({
    mutationFn: async (input: { id: number; step: RecruitmentStep }) => {
      return await updateRecruitmentEntryStep(input);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["recruitmentEntries"] });
    },
  });

  function handleDrop(column: ColumnKey, entryId: number) {
    const nextStep = defaultStepForColumn(column);
    stepMutation.mutate({ id: entryId, step: nextStep });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header card */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                지원 현황 보드
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                드래그로 단계를 옮기고, 카드 클릭으로 상세를 편집할 수 있어요.
              </p>
            </div>
            <Button
              onClick={() => {
                createMutation.reset();
                setIsAddOpen(true);
              }}
              className="gap-2"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              지원 추가
            </Button>
          </div>

          {error ? (
            <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              목록 조회 오류:{" "}
              {error instanceof Error ? error.message : "알 수 없음"}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Stat cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="총 지원"
          value={String(entries.length)}
          icon="description"
          color="primary"
        />
        <StatCard
          label="면접"
          value={String(grouped.INTERVIEWING.length)}
          icon="event"
          color="amber"
        />
        <StatCard
          label="오퍼"
          value={String(entries.filter((e) => e.step === "OFFERED").length)}
          icon="workspace_premium"
          color="emerald"
        />
      </section>

      {/* Kanban board */}
      <section className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 xl:grid-cols-4">
        {(["APPLIED", "IN_REVIEW", "INTERVIEWING", "FINAL"] as const).map(
          (key) => (
            <KanbanColumn
              key={key}
              columnKey={key}
              count={grouped[key].length}
              isDragOver={dragOver === key}
              onDragOver={() => setDragOver(key)}
              onDragLeave={() => setDragOver(null)}
              onDrop={(entryId) => {
                setDragOver(null);
                handleDrop(key, entryId);
              }}
            >
              {isLoading ? (
                <Card className="border-dashed">
                  <CardContent className="p-6 text-center text-sm text-muted-foreground">
                    불러오는 중...
                  </CardContent>
                </Card>
              ) : grouped[key].length === 0 ? (
                <EmptySlot />
              ) : (
                grouped[key].map((e) => (
                  <KanbanCard
                    key={e.id}
                    id={e.id}
                    company={e.companyName}
                    role={e.position}
                    step={e.step}
                    appliedDate={e.appliedDate ?? null}
                    onStepChange={(step) =>
                      stepMutation.mutate({ id: e.id, step })
                    }
                    onDragStart={(id) => void id}
                    onOpenDetails={() => setSelected(e)}
                  />
                ))
              )}
            </KanbanColumn>
          )
        )}
      </section>

      <EntryDetailsModal
        key={selected?.id ?? "closed"}
        open={selected != null}
        entry={selected}
        onClose={() => setSelected(null)}
        onStepChange={(id, step) => {
          setSelected((prev) => (prev ? { ...prev, step } : prev));
          stepMutation.mutate({ id, step });
        }}
        onSave={async (payload) => {
          const updated = await updateRecruitmentEntry(payload);
          await qc.invalidateQueries({ queryKey: ["recruitmentEntries"] });
          setSelected(updated);
        }}
      />

      <AddEntryModal
        key={isAddOpen ? "open" : "closed"}
        open={isAddOpen}
        onClose={() => {
          createMutation.reset();
          setIsAddOpen(false);
        }}
        isSubmitting={createMutation.isPending}
        errorMessage={
          createMutation.error instanceof Error
            ? createMutation.error.message
            : null
        }
        onSubmit={(payload) => createMutation.mutate(payload)}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: string;
  color: keyof typeof statColorMap;
}) {
  const c = statColorMap[color];
  return (
    <Card className={cn("border-l-4 transition-shadow hover:shadow-md", c.border)}>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{value}</p>
        </div>
        <div className={cn("flex size-10 items-center justify-center rounded-lg", c.icon)}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function KanbanColumn({
  columnKey,
  count,
  children,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  columnKey: ColumnKey;
  count: number;
  children: React.ReactNode;
  isDragOver: boolean;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDrop: (entryId: number) => void;
}) {
  const meta = COLUMN_META[columnKey];
  return (
    <div className="flex min-h-[500px] flex-col gap-4">
      <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-foreground">{meta.title}</h3>
          <Badge variant="secondary" className="text-[10px]">
            {count}
          </Badge>
        </div>
      </div>
      <div
        className={cn(
          "flex flex-col gap-3 rounded-xl p-1 transition-all",
          isDragOver && "bg-primary/5 ring-2 ring-primary/20"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          onDragOver();
        }}
        onDragLeave={() => onDragLeave()}
        onDrop={(e) => {
          e.preventDefault();
          const raw = e.dataTransfer.getData(
            "text/devweb-recruitment-entry-id"
          );
          const id = Number(raw);
          if (!Number.isNaN(id) && id > 0) onDrop(id);
        }}
      >
        {children}
      </div>
    </div>
  );
}

function stepBorderColor(step: RecruitmentStep) {
  switch (step) {
    case "OFFERED":
      return "border-l-emerald-500";
    case "INTERVIEWING":
      return "border-l-amber-500";
    case "REJECTED":
      return "border-l-red-500";
    default:
      return "border-l-primary";
  }
}

function KanbanCard({
  id,
  company,
  role,
  step,
  appliedDate,
  onStepChange,
  onDragStart,
  onOpenDetails,
}: {
  id: number;
  company: string;
  role: string;
  step: RecruitmentStep;
  appliedDate: string | null;
  onStepChange: (step: RecruitmentStep) => void;
  onDragStart: (id: number) => void;
  onOpenDetails: () => void;
}) {
  return (
    <Card
      className={cn(
        "cursor-grab border-l-4 transition-all hover:shadow-md hover:border-primary/30",
        stepBorderColor(step)
      )}
      draggable
      role="button"
      tabIndex={0}
      onClick={onOpenDetails}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpenDetails();
      }}
      onDragStart={(e) => {
        e.dataTransfer.setData(
          "text/devweb-recruitment-entry-id",
          String(id)
        );
        onDragStart(id);
      }}
    >
      <CardContent className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h4 className="font-bold leading-tight text-foreground">
              {company}
            </h4>
            <p className="text-sm text-muted-foreground">{role}</p>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="material-symbols-outlined text-sm">timeline</span>
            {toKoreanStep(step)}
          </div>
          <select
            value={step}
            onChange={(e) =>
              onStepChange(e.target.value as RecruitmentStep)
            }
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="h-7 rounded-md border border-input bg-background px-2 text-xs font-medium text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-ring"
          >
            <option value="READY">준비</option>
            <option value="APPLIED">지원</option>
            <option value="DOC_PASSED">서류 합격</option>
            <option value="TEST_PHASE">테스트</option>
            <option value="INTERVIEWING">면접</option>
            <option value="OFFERED">오퍼</option>
            <option value="REJECTED">불합격</option>
            <option value="ON_HOLD">보류</option>
          </select>
        </div>

        {appliedDate ? (
          <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="material-symbols-outlined text-sm">
              calendar_today
            </span>
            지원일: {appliedDate}
          </div>
        ) : null}

        <Separator />

        <div className="mt-3 flex items-center justify-between">
          <Badge
            variant={
              step === "OFFERED"
                ? "default"
                : step === "REJECTED"
                  ? "destructive"
                  : "secondary"
            }
            className="text-[10px]"
          >
            {toKoreanStep(step)}
          </Badge>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-primary"
            aria-label="메모"
          >
            <span className="material-symbols-outlined text-lg">
              sticky_note_2
            </span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function EntryDetailsModal({
  open,
  entry,
  onClose,
  onStepChange,
  onSave,
}: {
  open: boolean;
  entry: RecruitmentEntry | null;
  onClose: () => void;
  onStepChange: (id: number, step: RecruitmentStep) => void;
  onSave: (payload: {
    id: number;
    companyName: string;
    position: string;
    step: RecruitmentStep;
    platformType: PlatformType;
    externalId: string | null;
    appliedDate: string | null;
  }) => Promise<void>;
}) {
  const qc = useQueryClient();
  const [companyName, setCompanyName] = useState(entry?.companyName ?? "");
  const [position, setPosition] = useState(entry?.position ?? "");
  const [appliedDate, setAppliedDate] = useState(entry?.appliedDate ?? "");
  const [externalId, setExternalId] = useState(entry?.externalId ?? "");
  const [platformType, setPlatformType] = useState<PlatformType>(entry?.platformType ?? "MANUAL");
  const [justSaved, setJustSaved] = useState(false);
  const [newNote, setNewNote] = useState("");

  const entryId = entry?.id ?? null;
  const notesQuery = useRecruitmentEntryNotes(entryId, open);

  const createNoteMutation = useMutation({
    mutationFn: async () => {
      if (!entry) throw new Error("entry가 없습니다.");
      if (!newNote.trim()) throw new Error("메모를 입력해 주세요.");
      return await createRecruitmentEntryNote(entry.id, newNote.trim());
    },
    onSuccess: async () => {
      setNewNote("");
      await qc.invalidateQueries({
        queryKey: ["recruitmentEntryNotes", entryId],
      });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: number) => {
      if (!entry) throw new Error("entry가 없습니다.");
      await deleteRecruitmentEntryNote(entry.id, noteId);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: ["recruitmentEntryNotes", entryId],
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!entry) throw new Error("entry가 없습니다.");
      if (!companyName.trim() || !position.trim()) {
        throw new Error("회사/포지션은 필수입니다.");
      }
      const minDelayMs = 400;
      const startedAt = Date.now();

      await onSave({
        id: entry.id,
        companyName: companyName.trim(),
        position: position.trim(),
        step: entry.step,
        platformType,
        externalId: externalId.trim() ? externalId.trim() : null,
        appliedDate: appliedDate ? appliedDate : null,
      });

      const elapsed = Date.now() - startedAt;
      if (elapsed < minDelayMs) {
        await new Promise((r) => setTimeout(r, minDelayMs - elapsed));
      }
    },
    onSuccess: () => {
      setJustSaved(true);
      window.setTimeout(() => setJustSaved(false), 2000);
    },
  });

  if (!open || !entry) return null;

  const notes = notesQuery.data ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      onMouseDown={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative z-10 max-h-[90vh] w-[min(560px,calc(100%-24px))] overflow-y-auto rounded-2xl border border-border bg-background p-6 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <Badge variant="outline" className="mb-2 text-[10px]">
              지원 상세
            </Badge>
            <div className="mt-2 grid grid-cols-1 gap-2">
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="회사명"
                aria-label="회사명"
                className="font-bold"
              />
              <Input
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="포지션"
                aria-label="포지션"
              />
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="닫기"
          >
            <span className="material-symbols-outlined">close</span>
          </Button>
        </div>

        {justSaved ? (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300">
            <span className="material-symbols-outlined text-lg">
              check_circle
            </span>
            저장 완료
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                지원일
              </p>
              <input
                type="date"
                value={appliedDate}
                onChange={(e) => setAppliedDate(e.target.value)}
                className="mt-2 h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-ring"
                aria-label="지원일"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-start gap-3 p-4">
              <span className="material-symbols-outlined mt-0.5 text-lg text-muted-foreground">
                timeline
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  현재 단계
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  {toKoreanStep(entry.step)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                플랫폼
              </p>
              <select
                value={platformType}
                onChange={(e) =>
                  setPlatformType(e.target.value as PlatformType)
                }
                className="mt-2 h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-ring"
                aria-label="플랫폼"
              >
                {ALL_PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {platformLabel(p)}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                외부 ID
              </p>
              <Input
                value={externalId}
                onChange={(e) => setExternalId(e.target.value)}
                className="mt-2"
                placeholder="예: 원티드/링크드인 등 externalId"
                aria-label="외부 ID"
              />
            </CardContent>
          </Card>
        </div>

        <Card className="mt-5 bg-muted/30">
          <CardContent className="p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              단계 변경
            </p>
            <select
              value={entry.step}
              onChange={(e) =>
                onStepChange(entry.id, e.target.value as RecruitmentStep)
              }
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-ring"
            >
              <option value="READY">준비</option>
              <option value="APPLIED">지원</option>
              <option value="DOC_PASSED">서류 합격</option>
              <option value="TEST_PHASE">테스트</option>
              <option value="INTERVIEWING">면접</option>
              <option value="OFFERED">오퍼</option>
              <option value="REJECTED">불합격</option>
              <option value="ON_HOLD">보류</option>
            </select>
            <p className="mt-2 text-xs text-muted-foreground">
              카드 드래그로도 이동할 수 있고, 여기서는 단계 값을 정확히 선택할 수
              있어요.
            </p>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="mt-5">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-muted-foreground">
                  sticky_note_2
                </span>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  메모
                </p>
              </div>
              <Badge variant="secondary" className="text-[10px]">
                {notesQuery.isLoading ? "..." : `${notes.length}개`}
              </Badge>
            </div>

            <div className="flex gap-2">
              <Input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="메모를 입력해 주세요"
              />
              <Button
                size="sm"
                disabled={createNoteMutation.isPending}
                onClick={() => createNoteMutation.mutate()}
              >
                추가
              </Button>
            </div>
            {createNoteMutation.error ? (
              <p className="mt-2 text-sm text-destructive">
                메모 오류:{" "}
                {createNoteMutation.error instanceof Error
                  ? createNoteMutation.error.message
                  : "알 수 없음"}
              </p>
            ) : null}

            <div className="mt-4 space-y-2">
              {notesQuery.isLoading ? (
                <Card className="border-dashed">
                  <CardContent className="p-4 text-center text-sm text-muted-foreground">
                    메모 불러오는 중...
                  </CardContent>
                </Card>
              ) : notesQuery.error ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  메모 조회 오류:{" "}
                  {notesQuery.error instanceof Error
                    ? notesQuery.error.message
                    : "알 수 없음"}
                </div>
              ) : notes.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="p-4 text-center text-sm text-muted-foreground">
                    아직 메모가 없어요.
                  </CardContent>
                </Card>
              ) : (
                notes.map((n) => (
                  <div
                    key={n.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/30 p-3"
                  >
                    <div className="min-w-0">
                      <p className="whitespace-pre-wrap break-words text-sm text-foreground">
                        {n.content}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {n.createdAt
                          ? n.createdAt.slice(0, 19).replace("T", " ")
                          : ""}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteNoteMutation.mutate(n.id)}
                      disabled={deleteNoteMutation.isPending}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label="메모 삭제"
                    >
                      <span className="material-symbols-outlined text-lg">
                        delete
                      </span>
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <div className="mt-5 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="gap-2"
          >
            {saveMutation.isPending ? (
              <>
                <span className="material-symbols-outlined animate-spin text-lg">
                  progress_activity
                </span>
                저장 중...
              </>
            ) : (
              "저장"
            )}
          </Button>
        </div>

        {saveMutation.error ? (
          <p className="mt-3 text-sm text-destructive">
            저장 오류:{" "}
            {saveMutation.error instanceof Error
              ? saveMutation.error.message
              : "알 수 없음"}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function AddEntryModal({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  errorMessage,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    companyName: string;
    position: string;
    appliedDate: string | null;
    platformType: PlatformType;
  }) => void;
  isSubmitting: boolean;
  errorMessage: string | null;
}) {
  const [companyName, setCompanyName] = useState("");
  const [position, setPosition] = useState("");
  const [appliedDate, setAppliedDate] = useState(todayLocalISODate());
  const [platformType, setPlatformType] = useState<PlatformType>("MANUAL");

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      onMouseDown={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative z-10 w-[min(560px,calc(100%-24px))] rounded-2xl border border-border bg-background p-6 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <Badge variant="outline" className="mb-2 text-[10px]">
              지원 추가
            </Badge>
            <h3 className="mt-1 text-xl font-bold text-foreground">
              새로운 지원을 기록해요
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              저장 후에는 카드에서 단계 이동/상세 편집이 가능해요.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="닫기"
          >
            <span className="material-symbols-outlined">close</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              회사명
            </label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="mt-1.5"
              placeholder="예: 네이버"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              포지션
            </label>
            <Input
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="mt-1.5"
              placeholder="예: 백엔드 엔지니어"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              지원일
            </label>
            <input
              type="date"
              value={appliedDate}
              onChange={(e) => setAppliedDate(e.target.value)}
              className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              지원 플랫폼
            </label>
            <select
              value={platformType}
              onChange={(e) =>
                setPlatformType(e.target.value as PlatformType)
              }
              className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-ring"
            >
              {ALL_PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {platformLabel(p)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {errorMessage ? (
          <p className="mt-3 text-sm text-destructive">
            생성 오류: {errorMessage}
          </p>
        ) : null}

        <div className="mt-5 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button
            disabled={isSubmitting}
            onClick={() =>
              onSubmit({
                companyName,
                position,
                appliedDate: appliedDate ? appliedDate : null,
                platformType,
              })
            }
          >
            저장
          </Button>
        </div>
      </div>
    </div>
  );
}

function EmptySlot() {
  return (
    <Card className="border-2 border-dashed">
      <CardContent className="flex flex-col items-center justify-center p-6 text-muted-foreground">
        <span className="material-symbols-outlined mb-1 text-3xl">
          add_circle
        </span>
        <p className="text-xs font-medium">여기에 추가</p>
      </CardContent>
    </Card>
  );
}
