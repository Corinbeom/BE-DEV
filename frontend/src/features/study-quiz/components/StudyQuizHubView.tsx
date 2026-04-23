"use client";

import Link from "next/link";
import { useCsQuizSessions } from "../hooks/useCsQuizSessions";
import { useDeleteCsQuizSession } from "../hooks/useCsQuizMutations";
import { TOPIC_LABEL, DIFFICULTY_META } from "../constants";
import type { CsQuizSession } from "../api/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useResumeSessions } from "@/features/resume-analyzer/hooks/useResumeSessions";
import { LearningInsights } from "@/features/dashboard/components/LearningInsights";

type StatusConfig = {
  label: string;
  borderColor: string;
  dotColor: string;
  textColor: string;
};

function statusConfig(status: string): StatusConfig {
  switch (status) {
    case "QUESTIONS_READY":
      return {
        label: "준비됨",
        borderColor: "border-l-primary",
        dotColor: "bg-primary",
        textColor: "text-primary",
      };
    case "CREATED":
      return {
        label: "생성 중",
        borderColor: "border-l-amber-500",
        dotColor: "bg-amber-500",
        textColor: "text-amber-600",
      };
    case "FAILED":
      return {
        label: "실패",
        borderColor: "border-l-destructive",
        dotColor: "bg-destructive",
        textColor: "text-destructive",
      };
    default:
      return {
        label: status,
        borderColor: "border-l-border",
        dotColor: "bg-muted-foreground/40",
        textColor: "text-muted-foreground",
      };
  }
}

function formatLastActivity(isoString: string | null): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}일 전`;
  return date.toLocaleDateString("ko-KR");
}

export function StudyQuizHubView() {
  const { data: sessions = [], isLoading, error } = useCsQuizSessions();
  const { data: resumeSessions = [] } = useResumeSessions();
  const deleteSession = useDeleteCsQuizSession();

  const readyCount = sessions.filter((s) => s.status === "QUESTIONS_READY").length;
  const failedCount = sessions.filter((s) => s.status === "FAILED").length;

  function onDelete(e: React.MouseEvent, sessionId: number) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("이 세션을 삭제하시겠어요?")) return;
    deleteSession.mutate(sessionId);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Hero ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-foreground">CS 퀴즈</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            객관식 60% + 주관식 40%로 CS 지식을 점검하고 AI 피드백을 받아보세요.
          </p>
        </div>
        <Link
          href="/study-quiz/practice"
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
        >
          <span className="material-symbols-outlined text-sm">school</span>
          새 세션 시작
        </Link>
      </div>

      {/* ── Stats strip ── */}
      {!isLoading && sessions.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:max-w-lg">
          {[
            {
              label: "전체 세션",
              value: sessions.length,
              icon: "quiz",
              iconCls: "text-muted-foreground bg-muted",
            },
            {
              label: "준비됨",
              value: readyCount,
              icon: "check_circle",
              iconCls: "text-primary bg-primary/10",
            },
            {
              label: "실패",
              value: failedCount,
              icon: "error",
              iconCls: "text-destructive bg-destructive/10",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-lg",
                  stat.iconCls
                )}
              >
                <span className="material-symbols-outlined text-[20px]">{stat.icon}</span>
              </div>
              <div>
                <p className="text-xl font-bold leading-none text-foreground">{stat.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Session list ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">세션 이력</span>
          {sessions.length > 0 && (
            <span className="text-xs text-muted-foreground">{sessions.length}개</span>
          )}
        </div>

        {error ? (
          <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <span className="material-symbols-outlined text-destructive">error</span>
            <p className="text-sm text-destructive">
              세션 목록을 불러오지 못했습니다.{" "}
              {error instanceof Error ? error.message : ""}
            </p>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border border-border bg-card p-4"
              >
                <div className="h-3 w-1/2 rounded bg-muted" />
                <div className="mt-3 h-4 w-3/4 rounded bg-muted" />
                <div className="mt-2 h-3 w-1/3 rounded bg-muted" />
                <div className="mt-4 h-px w-full bg-muted" />
                <div className="mt-3 h-3 w-1/4 rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border p-10 text-center">
            <span className="material-symbols-outlined text-4xl text-muted-foreground/40">
              quiz
            </span>
            <p className="text-sm text-muted-foreground">아직 퀴즈 기록이 없어요.</p>
            <Link
              href="/study-quiz/practice"
              className="text-sm font-semibold text-primary hover:underline"
            >
              첫 퀴즈 시작하기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onDelete={onDelete}
                isDeleting={deleteSession.isPending}
              />
            ))}
          </div>
        )}
      </div>

      <LearningInsights quizSessions={sessions} resumeSessions={resumeSessions} />
    </div>
  );
}

function SessionCard({
  session,
  onDelete,
  isDeleting,
}: {
  session: CsQuizSession;
  onDelete: (e: React.MouseEvent, id: number) => void;
  isDeleting: boolean;
}) {
  const topics = Array.isArray(session.topics) ? session.topics : [];
  const diffMeta = DIFFICULTY_META[session.difficulty];
  const cfg = statusConfig(session.status);
  const lastActivityLabel = formatLastActivity(session.updatedAt ?? session.createdAt);

  return (
    <Link href={`/study-quiz/practice?sessionId=${session.id}`}>
      <div
        className={cn(
          "group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent/30",
          "border-l-[3px]",
          cfg.borderColor
        )}
      >
        {/* Status row */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className={cn("size-1.5 rounded-full", cfg.dotColor)} />
            <span className={cn("text-xs font-semibold", cfg.textColor)}>{cfg.label}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
            disabled={isDeleting}
            onClick={(e) => onDelete(e, session.id)}
          >
            <span className="material-symbols-outlined text-sm">delete</span>
          </Button>
        </div>

        {/* Title */}
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
          {session.title}
        </p>

        {/* Tags */}
        <div className="mt-2 flex min-h-[22px] flex-wrap gap-1">
          {topics.slice(0, 2).map((t) => (
            <span
              key={t}
              className="rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] font-semibold text-muted-foreground"
            >
              {TOPIC_LABEL[t] ?? t}
            </span>
          ))}
          {topics.length > 2 && (
            <span className="text-[11px] text-muted-foreground">+{topics.length - 2}</span>
          )}
          {diffMeta && (
            <span
              className={cn(
                "rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold",
                diffMeta.color
              )}
            >
              {diffMeta.label}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between border-t border-border pt-3 mt-3">
          <span className="text-xs text-muted-foreground">{session.questions.length}문항</span>
          <span className="text-xs text-muted-foreground">{lastActivityLabel}</span>
        </div>
      </div>
    </Link>
  );
}
