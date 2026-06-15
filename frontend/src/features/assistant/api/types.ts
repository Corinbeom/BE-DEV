import type { CoachSummary } from "@/features/coach/api/types";

export type ChatRole = "user" | "assistant";

export type ChatTurn = {
  role: ChatRole;
  content: string;
};

export type AssistantChatRequest = {
  message: string;
  history: ChatTurn[];
};

export type AssistantStreamEvent = {
  token?: string;
  done?: boolean;
  error?: string;
};

export type BottleneckType = "RESUME" | "INTERVIEW" | "QUIZ" | "EMPTY" | "NONE";

export type DiagnosticResult = {
  type: BottleneckType;
  title: string;
  message: string;
  action: string;
};

export type AssistantSnapshot = CoachSummary;
