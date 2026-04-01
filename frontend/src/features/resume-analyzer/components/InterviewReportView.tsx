"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useResumeInterviewStats } from "../hooks/useResumeInterviewStats";
import { InterviewReportSection } from "./InterviewReportSection";

export function InterviewReportView() {
  const { data: stats, isLoading } = useResumeInterviewStats();

  const hasData =
    stats && stats.badgeStats.length > 0 && stats.attemptedQuestions > 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="size-8">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            면접 연습 리포트
          </h1>
          <p className="text-sm text-muted-foreground">
            면접 질문 연습 결과를 종합적으로 분석합니다
          </p>
        </div>
      </div>

      {/* Content */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {!isLoading && !hasData && (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <span className="material-symbols-outlined text-4xl text-muted-foreground">
            analytics
          </span>
          <p className="text-sm text-muted-foreground">
            아직 면접 연습 데이터가 없습니다.
          </p>
          <Link href="/resume-analyzer">
            <Button variant="outline" size="sm">
              면접 연습 시작하기
            </Button>
          </Link>
        </div>
      )}

      {!isLoading && hasData && stats && (
        <InterviewReportSection stats={stats} />
      )}
    </div>
  );
}
