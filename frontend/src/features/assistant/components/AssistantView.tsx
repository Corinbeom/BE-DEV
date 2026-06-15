"use client";

import { useMemo } from "react";
import { useCoachSummary } from "@/features/coach/hooks/useCoach";
import { useAssistantChat } from "../hooks/useAssistantChat";
import { ChatPanel } from "./ChatPanel";
import { DiagnosticCard } from "./DiagnosticCard";
import { diagnoseBottleneck, diagnosticAssistantTurn } from "./diagnostics";

export function AssistantView() {
  const summary = useCoachSummary();
  const diagnostic = useMemo(
    () => diagnoseBottleneck(summary.data),
    [summary.data],
  );
  const initialTurn = useMemo(
    () => diagnosticAssistantTurn(diagnostic),
    [diagnostic],
  );

  if (summary.isLoading) {
    return <AssistantSkeleton />;
  }

  if (summary.isError) {
    return (
      <section className="rounded-xl border border-destructive/40 bg-destructive/5 p-5">
        <p className="text-sm font-semibold text-destructive">AI 비서 데이터를 불러오지 못했습니다.</p>
        <p className="mt-1 text-sm text-muted-foreground">잠시 후 다시 시도해 주세요.</p>
      </section>
    );
  }

  return <AssistantReadyView diagnostic={diagnostic} initialTurn={initialTurn} />;
}

function AssistantReadyView({
  diagnostic,
  initialTurn,
}: {
  diagnostic: ReturnType<typeof diagnoseBottleneck>;
  initialTurn: string;
}) {
  const chat = useAssistantChat(initialTurn);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-bold text-foreground">취업준비 AI 비서</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          질문하기 전에 현재 데이터를 먼저 읽고 병목부터 짚습니다.
        </p>
      </header>

      <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
        <DiagnosticCard diagnostic={diagnostic} />
        <ChatPanel
          messages={chat.messages}
          isStreaming={chat.isStreaming}
          error={chat.error}
          onSend={chat.sendMessage}
          onStop={chat.stop}
        />
      </div>
    </div>
  );
}

function AssistantSkeleton() {
  return (
    <div className="space-y-5">
      <div>
        <div className="h-6 w-44 rounded-md bg-muted" />
        <div className="mt-2 h-4 w-72 rounded-md bg-muted" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
        <div className="h-52 rounded-xl border border-border bg-card" />
        <div className="h-[640px] rounded-xl border border-border bg-card" />
      </div>
    </div>
  );
}
