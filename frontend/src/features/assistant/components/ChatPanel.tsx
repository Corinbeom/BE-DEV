"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ChatTurn } from "../api/types";
import { MessageBubble } from "./MessageBubble";
import { SuggestedPrompts } from "./SuggestedPrompts";

export function ChatPanel({
  messages,
  isStreaming,
  error,
  onSend,
  onStop,
}: {
  messages: ChatTurn[];
  isStreaming: boolean;
  error: string | null;
  onSend: (message: string) => void;
  onStop: () => void;
}) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages]);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = draft.trim();
    if (!value || isStreaming) return;
    setDraft("");
    onSend(value);
  }

  return (
    <section className="flex min-h-[640px] flex-col rounded-xl border border-border bg-background">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-base font-bold text-foreground">AI 비서</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          이력서, 지원 현황, 면접, 퀴즈 데이터를 함께 보고 답합니다.
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
        {messages.map((message, index) => (
          <MessageBubble key={`${message.role}-${index}`} message={message} />
        ))}
        <div ref={scrollRef} />
      </div>

      <div className="border-t border-border p-4">
        {error && (
          <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <SuggestedPrompts
          disabled={isStreaming}
          onSelect={(prompt) => {
            setDraft(prompt);
          }}
        />

        <form onSubmit={submit} className="mt-3 flex flex-col gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={2000}
            rows={3}
            placeholder="지금 가장 막히는 지점을 물어보세요."
            disabled={isStreaming}
            className="max-h-40 resize-none"
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">{draft.length}/2000</span>
            <div className="flex items-center gap-2">
              {isStreaming && (
                <Button type="button" variant="outline" onClick={onStop}>
                  <span className="material-symbols-outlined text-base">stop</span>
                  중지
                </Button>
              )}
              <Button type="submit" disabled={!draft.trim() || isStreaming}>
                <span className="material-symbols-outlined text-base">send</span>
                보내기
              </Button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
