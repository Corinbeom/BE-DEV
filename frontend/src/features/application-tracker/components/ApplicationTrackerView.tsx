"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  createRecruitmentEntry,
  updateRecruitmentEntry,
  updateRecruitmentEntryStep,
} from "../api/recruitmentEntryApi";
import type { RecruitmentEntry, RecruitmentStep } from "../api/types";
import { useRecruitmentEntries } from "../hooks/useRecruitmentEntries";
import { useDevMemberId } from "@/features/member/hooks/useDevMemberId";

type ColumnKey = "APPLIED" | "IN_REVIEW" | "INTERVIEWING" | "FINAL";

function todayLocalISODate() {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

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

function columnTitle(key: ColumnKey) {
  switch (key) {
    case "APPLIED":
      return "지원 완료";
    case "IN_REVIEW":
      return "전형 진행";
    case "INTERVIEWING":
      return "면접";
    case "FINAL":
      return "결과";
  }
}

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

export function ApplicationTrackerView() {
  const qc = useQueryClient();
  const { memberId, isBootstrapping, error: memberError } = useDevMemberId();
  const { data: entries = [], isLoading, error } = useRecruitmentEntries(memberId);
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
    }) => {
      if (!memberId) throw new Error("memberId가 없습니다.");
      return await createRecruitmentEntry({
        memberId,
        companyName: input.companyName.trim(),
        position: input.position.trim(),
        step: "APPLIED",
        appliedDate: input.appliedDate,
      });
    },
    onSuccess: async () => {
      setIsAddOpen(false);
      await qc.invalidateQueries({ queryKey: ["recruitmentEntries", memberId] });
    },
  });

  const stepMutation = useMutation({
    mutationFn: async (input: { id: number; step: RecruitmentStep }) => {
      return await updateRecruitmentEntryStep(input);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["recruitmentEntries", memberId] });
    },
  });

  function handleDrop(column: ColumnKey, entryId: number) {
    const nextStep = defaultStepForColumn(column);
    stepMutation.mutate({ id: entryId, step: nextStep });
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
              지원 현황 보드
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              드래그로 단계를 옮기고, 카드 클릭으로 상세를 편집할 수 있어요.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                createMutation.reset();
                setIsAddOpen(true);
              }}
              disabled={isBootstrapping || !!memberError}
              className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-black text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              지원 추가
            </button>
          </div>
        </div>

        {(memberError || error) ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
            {memberError ? <p>member 오류: {memberError}</p> : null}
            {error ? (
              <p>
                목록 조회 오류: {error instanceof Error ? error.message : "알 수 없음"}
              </p>
            ) : null}
          </div>
        ) : null}

        <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
          <summary className="cursor-pointer select-none text-xs font-bold uppercase tracking-wider text-slate-500">
            개발 정보
          </summary>
          <div className="mt-2 flex flex-col gap-1">
            <p>
              {isBootstrapping
                ? "member 생성/조회 중..."
                : `memberId=${memberId ?? "없음"} / entries=${entries.length}`}
            </p>
            <p className="text-xs text-slate-500">
              로그인 도입 시 이 영역은 제거/대체될 예정입니다.
            </p>
          </div>
        </details>
      </section>

      <section className="flex flex-wrap gap-4">
        <StatCard
          label="총 지원"
          value={String(entries.length)}
          icon="description"
          iconClass="text-primary bg-primary/10"
          footer="API 연결됨"
        />
        <StatCard
          label="면접"
          value={String(grouped.INTERVIEWING.length)}
          icon="event"
          iconClass="text-amber-500 bg-amber-500/10"
          footer="현재 면접 단계"
        />
        <StatCard
          label="오퍼"
          value={String(entries.filter((e) => e.step === "OFFERED").length)}
          icon="workspace_premium"
          iconClass="text-emerald-500 bg-emerald-500/10"
          footer="OFFERED 기준"
        />
      </section>

      <section className="flex items-center justify-between">
        <div className="flex w-fit rounded-lg bg-slate-200/50 p-1 dark:bg-slate-800">
          <button
            type="button"
            className="flex items-center gap-2 rounded-md bg-white px-4 py-1.5 text-sm font-bold text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
          >
            <span className="material-symbols-outlined text-lg">view_kanban</span>
            칸반
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400"
          >
            <span className="material-symbols-outlined text-lg">table_chart</span>
            테이블
          </button>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
          >
            <span className="material-symbols-outlined text-lg">filter_list</span>
            필터
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
          >
            <span className="material-symbols-outlined text-lg">sort</span>
            정렬
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 xl:grid-cols-4">
        {(["APPLIED", "IN_REVIEW", "INTERVIEWING", "FINAL"] as const).map(
          (key) => (
            <KanbanColumn
              key={key}
              title={columnTitle(key)}
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
                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-800">
                  불러오는 중...
                </div>
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
                    onStepChange={(step) => stepMutation.mutate({ id: e.id, step })}
                    onDragStart={(id) => {
                      // no-op: column drop handler uses dataTransfer
                      void id;
                    }}
                    onOpenDetails={() => setSelected(e)}
                    tag={toKoreanStep(e.step)}
                    tagTone={
                      e.step === "OFFERED"
                        ? "emerald"
                        : e.step === "INTERVIEWING"
                          ? "amber"
                          : "primary"
                    }
                  />
                ))
              )}
            </KanbanColumn>
          ),
        )}
      </section>

      <EntryDetailsModal
        open={selected != null}
        entry={selected}
        onClose={() => setSelected(null)}
        onStepChange={(id, step) => {
          setSelected((prev) => (prev ? { ...prev, step } : prev));
          stepMutation.mutate({ id, step });
        }}
        onSave={async (payload) => {
          const updated = await updateRecruitmentEntry(payload);
          await qc.invalidateQueries({ queryKey: ["recruitmentEntries", memberId] });
          setSelected(updated);
        }}
      />

      <AddEntryModal
        open={isAddOpen}
        onClose={() => {
          createMutation.reset();
          setIsAddOpen(false);
        }}
        isSubmitting={createMutation.isPending}
        errorMessage={
          createMutation.error instanceof Error ? createMutation.error.message : null
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
  iconClass,
  footer,
  footerTone,
}: {
  label: string;
  value: string;
  icon: string;
  iconClass: string;
  footer: string;
  footerTone?: "good";
}) {
  return (
    <div className="min-w-[200px] flex-1 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <span className={["material-symbols-outlined rounded-lg p-2", iconClass].join(" ")}>
          {icon}
        </span>
      </div>
      <p className="text-3xl font-bold text-slate-900 dark:text-white">
        {value}
      </p>
      <p
        className={
          footerTone === "good"
            ? "mt-2 flex items-center gap-1 text-xs font-bold text-emerald-500"
            : "mt-2 text-xs text-slate-500"
        }
      >
        {footerTone === "good" ? (
          <>
            <span className="material-symbols-outlined text-xs">trending_up</span>
            {footer}
          </>
        ) : (
          footer
        )}
      </p>
    </div>
  );
}

function KanbanColumn({
  title,
  count,
  children,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
  isDragOver: boolean;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDrop: (entryId: number) => void;
}) {
  return (
    <div className="flex min-h-[500px] flex-col gap-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold dark:bg-slate-800">
            {count}
          </span>
        </div>
        <button
          type="button"
          className="text-slate-400 hover:text-slate-600"
          aria-label="더보기"
        >
          <span className="material-symbols-outlined">more_horiz</span>
        </button>
      </div>
      <div
        className={[
          "flex flex-col gap-3 rounded-xl p-1",
          isDragOver ? "bg-primary/5 ring-2 ring-primary/20" : "",
        ].join(" ")}
        onDragOver={(e) => {
          e.preventDefault();
          onDragOver();
        }}
        onDragLeave={() => onDragLeave()}
        onDrop={(e) => {
          e.preventDefault();
          const raw = e.dataTransfer.getData("text/devweb-recruitment-entry-id");
          const id = Number(raw);
          if (!Number.isNaN(id) && id > 0) onDrop(id);
        }}
      >
        {children}
      </div>
    </div>
  );
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
  tag,
  tagTone,
  noteCount,
  highlight,
  dimmed,
}: {
  id: number;
  company: string;
  role: string;
  step: RecruitmentStep;
  appliedDate: string | null;
  onStepChange: (step: RecruitmentStep) => void;
  onDragStart: (id: number) => void;
  onOpenDetails: () => void;
  tag: string;
  tagTone: "primary" | "amber" | "emerald" | "muted";
  noteCount?: number;
  highlight?: boolean;
  dimmed?: boolean;
}) {
  const tagClass =
    tagTone === "primary"
      ? "bg-primary/10 text-primary"
      : tagTone === "amber"
        ? "bg-amber-500/10 text-amber-600"
        : tagTone === "emerald"
          ? "bg-emerald-500/10 text-emerald-600"
          : "bg-slate-100 text-slate-500 dark:bg-slate-800";

  return (
    <div
      className={[
        "cursor-grab rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-primary/50 dark:border-slate-800 dark:bg-slate-900",
        highlight ? "border-l-4 border-l-amber-500" : "",
        dimmed ? "opacity-70 grayscale-[0.5] hover:opacity-100 hover:grayscale-0" : "",
      ].join(" ")}
      draggable
      role="button"
      tabIndex={0}
      onClick={onOpenDetails}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpenDetails();
      }}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/devweb-recruitment-entry-id", String(id));
        onDragStart(id);
      }}
    >
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h4 className="leading-tight font-bold text-slate-900 dark:text-white">
            {company}
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-400">{role}</p>
        </div>
        <div className="size-8 rounded bg-slate-50 p-1" />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-sm text-slate-400">
            timeline
          </span>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            단계: {toKoreanStep(step)}
          </p>
        </div>

        <select
          value={step}
          onChange={(e) => onStepChange(e.target.value as RecruitmentStep)}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold text-slate-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
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
        <div className="mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm text-slate-400">
            calendar_today
          </span>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            지원일: {appliedDate}
          </p>
        </div>
      ) : null}

      <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
        <span
          className={[
            "rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider",
            tagClass,
          ].join(" ")}
        >
          {tag}
        </span>

        <button
          type="button"
          className="flex items-center gap-1 text-sm font-medium text-slate-400 transition-colors hover:text-primary"
          aria-label="메모"
        >
          <span className="material-symbols-outlined text-lg">sticky_note_2</span>
          {noteCount != null ? <span className="text-[10px]">{noteCount}</span> : null}
        </button>
      </div>
    </div>
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
    externalId: string | null;
    appliedDate: string | null;
  }) => Promise<void>;
}) {
  const [companyName, setCompanyName] = useState("");
  const [position, setPosition] = useState("");
  const [appliedDate, setAppliedDate] = useState("");
  const [externalId, setExternalId] = useState("");

  useEffect(() => {
    if (!open || !entry) return;
    setCompanyName(entry.companyName);
    setPosition(entry.position);
    setAppliedDate(entry.appliedDate ?? "");
    setExternalId(entry.externalId ?? "");
  }, [open, entry]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!entry) throw new Error("entry가 없습니다.");
      if (!companyName.trim() || !position.trim()) {
        throw new Error("회사/포지션은 필수입니다.");
      }
      await onSave({
        id: entry.id,
        companyName: companyName.trim(),
        position: position.trim(),
        step: entry.step,
        externalId: externalId.trim() ? externalId.trim() : null,
        appliedDate: appliedDate ? appliedDate : null,
      });
    },
  });

  if (!open || !entry) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      onMouseDown={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <div
        className="relative z-10 w-[min(560px,calc(100%-24px))] rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              지원 상세
            </p>
            <div className="mt-2 grid grid-cols-1 gap-2">
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-white/10 dark:bg-slate-900 dark:text-white"
                placeholder="회사명"
                aria-label="회사명"
              />
              <input
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
                placeholder="포지션"
                aria-label="포지션"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/5"
            aria-label="닫기"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              지원일
            </p>
            <input
              type="date"
              value={appliedDate}
              onChange={(e) => setAppliedDate(e.target.value)}
              className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-white/10 dark:bg-slate-950 dark:text-white"
              aria-label="지원일"
            />
          </div>

          <DetailItem label="현재 단계" value={toKoreanStep(entry.step)} icon="timeline" />
          <DetailItem label="플랫폼" value={entry.platformType} icon="public" />
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              외부 ID
            </p>
            <input
              value={externalId}
              onChange={(e) => setExternalId(e.target.value)}
              className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-white/10 dark:bg-slate-950 dark:text-slate-100"
              placeholder="예: 원티드/링크드인 등 externalId"
              aria-label="외부 ID"
            />
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-white/5">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            단계 변경
          </p>
          <select
            value={entry.step}
            onChange={(e) => onStepChange(entry.id, e.target.value as RecruitmentStep)}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
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
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            카드 드래그로도 이동할 수 있고, 여기서는 단계 값을 정확히 선택할 수 있어요.
          </p>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
          >
            닫기
          </button>
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="h-10 rounded-lg bg-primary px-4 text-sm font-black text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            저장
          </button>
        </div>

        {saveMutation.error ? (
          <p className="mt-3 text-sm text-red-600">
            저장 오류:{" "}
            {saveMutation.error instanceof Error ? saveMutation.error.message : "알 수 없음"}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <span className="material-symbols-outlined mt-0.5 text-lg text-slate-400">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <p className="mt-1 truncate text-sm font-bold text-slate-900 dark:text-white">
          {value}
        </p>
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
  }) => void;
  isSubmitting: boolean;
  errorMessage: string | null;
}) {
  const [companyName, setCompanyName] = useState("");
  const [position, setPosition] = useState("");
  const [appliedDate, setAppliedDate] = useState(todayLocalISODate());

  useEffect(() => {
    if (!open) return;
    setCompanyName("");
    setPosition("");
    setAppliedDate(todayLocalISODate());
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      onMouseDown={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <div
        className="relative z-10 w-[min(560px,calc(100%-24px))] rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              지원 추가
            </p>
            <h3 className="mt-1 text-xl font-black text-slate-900 dark:text-white">
              새로운 지원을 기록해요
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              저장 후에는 카드에서 단계 이동/상세 편집이 가능해요.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/5"
            aria-label="닫기"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              회사명
            </p>
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-white/10 dark:bg-slate-900 dark:text-white"
              placeholder="예: 네이버"
            />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              포지션
            </p>
            <input
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
              placeholder="예: 백엔드 엔지니어"
            />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              지원일
            </p>
            <input
              type="date"
              value={appliedDate}
              onChange={(e) => setAppliedDate(e.target.value)}
              className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-white/10 dark:bg-slate-900 dark:text-white"
            />
          </div>
        </div>

        {errorMessage ? (
          <p className="mt-3 text-sm text-red-600">생성 오류: {errorMessage}</p>
        ) : null}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
          >
            취소
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() =>
              onSubmit({
                companyName,
                position,
                appliedDate: appliedDate ? appliedDate : null,
              })
            }
            className="h-10 rounded-lg bg-primary px-4 text-sm font-black text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptySlot() {
  return (
    <div className="group flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 p-6 text-slate-400 transition-colors hover:border-primary/30 dark:border-slate-800">
      <span className="material-symbols-outlined mb-1 text-3xl">add_circle</span>
      <p className="text-xs font-medium">여기에 추가</p>
    </div>
  );
}


