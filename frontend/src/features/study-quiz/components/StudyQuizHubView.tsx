"use client";

import Link from "next/link";
import { useCsQuizSessions } from "../hooks/useCsQuizSessions";
import { useDeleteCsQuizSession } from "../hooks/useCsQuizMutations";
import { TOPIC_LABEL, DIFFICULTY_META } from "../constants";
import type { CsQuizSession } from "../api/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function statusKorean(status: string) {
  switch (status) {
    case "QUESTIONS_READY":
      return "완료";
    case "CREATED":
      return "생성 중";
    case "FAILED":
      return "실패";
    default:
      return status;
  }
}

function statusVariant(status: string) {
  switch (status) {
    case "QUESTIONS_READY":
      return "default" as const;
    case "CREATED":
      return "secondary" as const;
    case "FAILED":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}

export function StudyQuizHubView() {
  const { data: sessions = [], isLoading } = useCsQuizSessions();
  const deleteSession = useDeleteCsQuizSession();

  function onDelete(e: React.MouseEvent, sessionId: number) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("이 세션을 삭제하시겠어요?")) return;
    deleteSession.mutate(sessionId);
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Hero */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary/10">
          <span className="material-symbols-outlined text-3xl text-primary">
            school
          </span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">CS 퀴즈</h1>
        <p className="mt-2 text-muted-foreground">
          객관식 60% + 주관식 40%로 CS 지식을 점검하고,
          <br />
          AI 피드백으로 부족한 부분을 보완하세요.
        </p>
        <Link
          href="/study-quiz/practice"
          className={cn(
            "mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/15 transition-all hover:bg-primary/90"
          )}
        >
          <span className="material-symbols-outlined text-sm">play_arrow</span>
          새 세션 시작
        </Link>
      </div>

      {/* Session List */}
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <h2 className="text-lg font-bold text-foreground">세션 이력</h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 w-2/3 rounded bg-muted" />
                  <div className="mt-2 h-3 w-1/3 rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center">
              <span className="material-symbols-outlined text-4xl text-muted-foreground/40">
                quiz
              </span>
              <p className="text-sm text-muted-foreground">
                아직 퀴즈 기록이 없어요.
              </p>
              <Link
                href="/study-quiz/practice"
                className="text-sm font-semibold text-primary hover:underline"
              >
                첫 퀴즈 시작하기
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
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

  return (
    <Link href={`/study-quiz/practice?sessionId=${session.id}`}>
      <Card className="group transition-all hover:border-primary/30 hover:shadow-md">
        <CardContent className="flex items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <span className="material-symbols-outlined">quiz</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                {session.title}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                {topics.slice(0, 3).map((t) => (
                  <Badge key={t} variant="secondary" className="text-[10px]">
                    {TOPIC_LABEL[t] ?? t}
                  </Badge>
                ))}
                {topics.length > 3 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{topics.length - 3}
                  </span>
                )}
                {diffMeta && (
                  <Badge
                    variant="outline"
                    className={cn("text-[10px] font-semibold", diffMeta.color)}
                  >
                    {diffMeta.label}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <Badge variant={statusVariant(session.status)}>
                {statusKorean(session.status)}
              </Badge>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {new Date(session.createdAt).toLocaleDateString("ko-KR")}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {session.questions.length}문항
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-destructive"
              disabled={isDeleting}
              onClick={(e) => onDelete(e, session.id)}
            >
              <span className="material-symbols-outlined text-sm">delete</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
