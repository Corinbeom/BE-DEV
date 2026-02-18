"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { createRecruitmentEntry } from "../api/recruitmentEntryApi";
import type { RecruitmentEntry, RecruitmentStep } from "../api/types";
import { useRecruitmentEntries } from "../hooks/useRecruitmentEntries";
import { useDevMemberId } from "@/features/member/hooks/useDevMemberId";

type ColumnKey = "APPLIED" | "IN_REVIEW" | "INTERVIEWING" | "FINAL";

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

export function ApplicationTrackerView() {
  const qc = useQueryClient();
  const { memberId, isBootstrapping, error: memberError } = useDevMemberId();
  const { data: entries = [], isLoading, error } = useRecruitmentEntries(memberId);
  const [companyName, setCompanyName] = useState("");
  const [position, setPosition] = useState("");

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
    mutationFn: async () => {
      if (!memberId) throw new Error("memberId가 없습니다.");
      if (!companyName.trim() || !position.trim()) {
        throw new Error("회사/포지션을 입력해 주세요.");
      }
      return await createRecruitmentEntry({
        memberId,
        companyName: companyName.trim(),
        position: position.trim(),
        step: "APPLIED",
      });
    },
    onSuccess: async () => {
      setCompanyName("");
      setPosition("");
      await qc.invalidateQueries({ queryKey: ["recruitmentEntries", memberId] });
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              개발용 연결 상태
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {isBootstrapping
                ? "member 생성/조회 중..."
                : memberError
                  ? `member 오류: ${memberError}`
                  : `memberId=${memberId ?? "없음"} / entries=${entries.length}`}
            </p>
            {error ? (
              <p className="text-sm text-red-600">
                목록 조회 오류: {error instanceof Error ? error.message : "알 수 없음"}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="h-10 w-44 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-800 dark:bg-slate-900"
              placeholder="회사명"
            />
            <input
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="h-10 w-44 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-800 dark:bg-slate-900"
              placeholder="포지션"
            />
            <button
              type="button"
              disabled={createMutation.isPending}
              onClick={() => createMutation.mutate()}
              className="flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-bold text-white transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              새 지원 추가
            </button>
          </div>
        </div>
        {createMutation.error ? (
          <p className="mt-2 text-sm text-red-600">
            생성 오류:{" "}
            {createMutation.error instanceof Error
              ? createMutation.error.message
              : "알 수 없음"}
          </p>
        ) : null}
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
            <KanbanColumn key={key} title={columnTitle(key)} count={grouped[key].length}>
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
                    company={e.companyName}
                    role={e.position}
                    dateLabel="단계"
                    date={e.step}
                    tag={e.step}
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
}: {
  title: string;
  count: number;
  children: React.ReactNode;
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
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function KanbanCard({
  company,
  role,
  dateLabel,
  date,
  tag,
  tagTone,
  noteCount,
  highlight,
  dimmed,
}: {
  company: string;
  role: string;
  dateLabel: string;
  date: string;
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

      {highlight ? (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 p-2 dark:bg-amber-500/10">
          <span className="material-symbols-outlined text-lg text-amber-600">
            upcoming
          </span>
          <p className="text-[11px] font-bold uppercase text-amber-700 dark:text-amber-500">
            {dateLabel}: {date}
          </p>
        </div>
      ) : (
        <div className="mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm text-slate-400">
            calendar_today
          </span>
          <p className="text-xs font-medium text-slate-500">
            {dateLabel} {date}
          </p>
        </div>
      )}

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

function EmptySlot() {
  return (
    <div className="group flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 p-6 text-slate-400 transition-colors hover:border-primary/30 dark:border-slate-800">
      <span className="material-symbols-outlined mb-1 text-3xl">add_circle</span>
      <p className="text-xs font-medium">여기에 추가</p>
    </div>
  );
}


