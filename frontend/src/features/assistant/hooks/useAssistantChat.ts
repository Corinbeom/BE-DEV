"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { streamAssistantChat } from "../api/assistantApi";
import type { ChatTurn } from "../api/types";

const MAX_HISTORY_TURNS = 6;

export function useAssistantChat(initialAssistantMessage?: string) {
  const [messages, setMessages] = useState<ChatTurn[]>(() =>
    initialAssistantMessage
      ? [{ role: "assistant", content: initialAssistantMessage }]
      : [],
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const history = useMemo(
    () => messages.slice(-MAX_HISTORY_TURNS),
    [messages],
  );

  const sendMessage = useCallback(
    async (message: string) => {
      const trimmed = message.trim();
      if (!trimmed || isStreaming) return;

      const currentHistory = messages.slice(-MAX_HISTORY_TURNS);
      const controller = new AbortController();
      abortRef.current = controller;
      setError(null);
      setIsStreaming(true);
      setMessages((prev) => [
        ...prev,
        { role: "user", content: trimmed },
        { role: "assistant", content: "" },
      ]);

      try {
        await streamAssistantChat(
          { message: trimmed, history: currentHistory },
          {
            signal: controller.signal,
            onToken: (token) => {
              setMessages((prev) => appendToLastAssistant(prev, token));
            },
            onError: (code) => {
              setError(errorMessage(code));
            },
            onDone: () => {
              setIsStreaming(false);
            },
          },
        );
      } catch (e) {
        if ((e as DOMException).name !== "AbortError") {
          setError(e instanceof Error ? e.message : "AI 비서 응답을 불러오지 못했습니다.");
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [isStreaming, messages],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return {
    messages,
    history,
    isStreaming,
    error,
    sendMessage,
    stop,
  };
}

function appendToLastAssistant(messages: ChatTurn[], token: string) {
  if (messages.length === 0) return [{ role: "assistant" as const, content: token }];
  const next = [...messages];
  const last = next[next.length - 1];
  if (last.role !== "assistant") {
    next.push({ role: "assistant", content: token });
    return next;
  }
  next[next.length - 1] = { ...last, content: last.content + token };
  return next;
}

function errorMessage(code: string) {
  const map: Record<string, string> = {
    timeout: "응답 시간이 초과되었습니다. 질문을 조금 더 좁혀 다시 시도해 주세요.",
    rate_limit: "AI 요청 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.",
    upstream_error: "AI 응답 생성 중 문제가 발생했습니다.",
    parse_error: "스트리밍 응답을 해석하지 못했습니다.",
  };
  return map[code] ?? "AI 비서 응답을 불러오지 못했습니다.";
}
