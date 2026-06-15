import { apiBaseUrl } from "@/lib/api";
import type { AssistantChatRequest, AssistantStreamEvent } from "./types";

type StreamHandlers = {
  signal: AbortSignal;
  onToken: (token: string) => void;
  onDone: () => void;
  onError: (code: string) => void;
};

export async function streamAssistantChat(
  request: AssistantChatRequest,
  handlers: StreamHandlers,
) {
  const res = await fetch(`${apiBaseUrl()}/api/assistant/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    credentials: "include",
    cache: "no-store",
    signal: handlers.signal,
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(parseErrorMessage(body, res.status));
  }

  if (!res.body) {
    throw new Error("스트리밍 응답을 읽을 수 없습니다.");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const event = parseSseEvent(part);
      if (!event) continue;
      if (event.token) handlers.onToken(event.token);
      if (event.error) handlers.onError(event.error);
      if (event.done) handlers.onDone();
    }
  }

  if (buffer.trim()) {
    const event = parseSseEvent(buffer);
    if (event?.token) handlers.onToken(event.token);
    if (event?.error) handlers.onError(event.error);
    if (event?.done) handlers.onDone();
  }
}

export function parseSseEvent(raw: string): AssistantStreamEvent | null {
  const data = raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice("data:".length).trim())
    .join("");

  if (!data) return null;

  try {
    return JSON.parse(data) as AssistantStreamEvent;
  } catch {
    return { error: "parse_error" };
  }
}

function parseErrorMessage(body: string, status: number) {
  try {
    const parsed = JSON.parse(body);
    return parsed?.error?.message ?? `AI 비서 호출에 실패했습니다. (${status})`;
  } catch {
    return `AI 비서 호출에 실패했습니다. (${status})`;
  }
}
