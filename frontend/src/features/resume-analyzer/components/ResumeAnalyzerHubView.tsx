"use client";

import Link from "next/link";
import { useResumeSessions } from "../hooks/useResumeSessions";
import { useDeleteResumeSession } from "../hooks/useResumeMutations";
import type { ResumeSession } from "../api/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function statusKorean(status: string) {
  switch (status) {
    case "QUESTIONS_READY":
      return "완료";
    case "EXTRACTED":
      return "텍스트 추출됨";
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
    case "EXTRACTED":
      return "secondary" as const;
    case "CREATED":
      return "secondary" as const;
    case "FAILED":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}

function positionLabel(type: string | null) {
  switch (type) {
    case "BE":
      return "Backend";
    case "FE":
      return "Frontend";
    case "MOBILE":
      return "Mobile";
    default:
      return type ?? "미지정";
  }
}

export function ResumeAnalyzerHubView() {
  const { data: sessions = [], isLoading } = useResumeSessions();
  const deleteSession = useDeleteResumeSession();

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
            psychology
          </span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">이력서 면접</h1>
        <p className="mt-2 text-muted-foreground">
          이력서를 분석해 실제 면접에서 나올 수 있는 질문을 생성하고,
          <br />
          AI 피드백으로 답변을 개선해 보세요.
        </p>
        <Link
          href="/resume-analyzer/practice"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/15 transition-all hover:bg-primary/90"
        >
          <span className="material-symbols-outlined text-sm">analytics</span>
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
                description
              </span>
              <p className="text-sm text-muted-foreground">
                아직 면접 연습 기록이 없어요.
              </p>
              <Link
                href="/resume-analyzer/practice"
                className="text-sm font-semibold text-primary hover:underline"
              >
                첫 세션 시작하기
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
  session: ResumeSession;
  onDelete: (e: React.MouseEvent, id: number) => void;
  isDeleting: boolean;
}) {
  return (
    <Link href={`/resume-analyzer/practice?sessionId=${session.id}`}>
      <Card className="group transition-all hover:border-primary/30 hover:shadow-md">
        <CardContent className="flex items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <span className="material-symbols-outlined">description</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                {session.title}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                {session.positionType && (
                  <Badge variant="secondary" className="text-[10px]">
                    {positionLabel(session.positionType)}
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
