"use client";

import { useCallback, useReducer } from "react";
import type { SpeechInterviewSession } from "../api/types";

// ── 타입 정의 ──────────────────────────────────────────────

export type InterviewMode = "voice" | "text";

export type InterviewPhase =
  | "LOBBY"
  | "INTRO"
  | "CONVERSING"
  | "CLOSING"
  | "REPORT";

export type ConversationSubPhase =
  | "AI_THINKING"   // AI가 다음 질문 생성 중
  | "AI_SPEAKING"   // TTS로 질문 재생 중
  | "USER_ANSWERING"; // 사용자 답변 녹음 중

export type ConversationEntry = {
  role: "ai" | "user";
  text: string;
  badge?: string | null;
};

export type SpeechInterviewState = {
  phase: InterviewPhase;
  subPhase: ConversationSubPhase;
  speechSession: SpeechInterviewSession | null;
  mode: InterviewMode;
  // 현재 턴 AI 메시지
  currentAiMessage: string;
  currentBadge: string | null;
  currentQuestionId: number | null;
  turnIndex: number;
  isComplete: boolean;
  // 대화 로그 (이전 턴 기록)
  conversationLog: ConversationEntry[];
};

// ── 액션 정의 ──────────────────────────────────────────────

type Action =
  | { type: "SESSION_CREATED"; session: SpeechInterviewSession; mode: InterviewMode }
  | { type: "START_INTRO" }
  | { type: "INTRO_DONE" }
  | { type: "AI_RESPONSE"; aiMessage: string; turnIndex: number; isComplete: boolean; questionId: number | null; badge: string | null }
  | { type: "AI_SPEAK_DONE" }
  | { type: "USER_SUBMIT"; answerText: string }
  | { type: "CLOSING_DONE" }
  | { type: "RESET" };

// ── 초기 상태 ──────────────────────────────────────────────

const INITIAL: SpeechInterviewState = {
  phase: "LOBBY",
  subPhase: "AI_THINKING",
  speechSession: null,
  mode: "voice",
  currentAiMessage: "",
  currentBadge: null,
  currentQuestionId: null,
  turnIndex: 0,
  isComplete: false,
  conversationLog: [],
};

// ── 리듀서 ──────────────────────────────────────────────────

function reducer(state: SpeechInterviewState, action: Action): SpeechInterviewState {
  switch (action.type) {
    case "SESSION_CREATED": {
      return {
        ...INITIAL,
        speechSession: action.session,
        mode: action.mode,
      };
    }

    case "START_INTRO":
      return { ...state, phase: "INTRO" };

    case "INTRO_DONE":
      return { ...state, phase: "CONVERSING", subPhase: "AI_THINKING" };

    case "AI_RESPONSE": {
      // AI 응답 수신 → AI_SPEAKING으로 전환
      if (action.isComplete) {
        return {
          ...state,
          phase: "CLOSING",
          isComplete: true,
          currentAiMessage: action.aiMessage,
          turnIndex: action.turnIndex,
        };
      }
      return {
        ...state,
        subPhase: "AI_SPEAKING",
        currentAiMessage: action.aiMessage,
        currentBadge: action.badge,
        currentQuestionId: action.questionId,
        turnIndex: action.turnIndex,
        isComplete: false,
      };
    }

    case "AI_SPEAK_DONE":
      // TTS 완료 → USER_ANSWERING
      return { ...state, subPhase: "USER_ANSWERING" };

    case "USER_SUBMIT": {
      // 답변 제출 → 대화 로그에 추가, AI_THINKING으로 전환
      const newLog: ConversationEntry[] = [
        ...state.conversationLog,
        { role: "ai", text: state.currentAiMessage, badge: state.currentBadge },
        { role: "user", text: action.answerText },
      ];
      return {
        ...state,
        subPhase: "AI_THINKING",
        conversationLog: newLog,
      };
    }

    case "CLOSING_DONE":
      return { ...state, phase: "REPORT" };

    case "RESET":
      return INITIAL;

    default:
      return state;
  }
}

// ── 훅 ────────────────────────────────────────────────────

export type SpeechInterviewActions = {
  sessionCreated: (session: SpeechInterviewSession, mode: InterviewMode) => void;
  startIntro: () => void;
  onIntroDone: () => void;
  aiResponse: (aiMessage: string, turnIndex: number, isComplete: boolean, questionId: number | null, badge: string | null) => void;
  aiSpeakDone: () => void;
  userSubmit: (answerText: string) => void;
  onClosingDone: () => void;
  reset: () => void;
};

export function useSpeechInterviewMachine(): [SpeechInterviewState, SpeechInterviewActions] {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  const actions: SpeechInterviewActions = {
    sessionCreated: useCallback(
      (session, mode) =>
        dispatch({ type: "SESSION_CREATED", session, mode }),
      []
    ),
    startIntro: useCallback(() => dispatch({ type: "START_INTRO" }), []),
    onIntroDone: useCallback(() => dispatch({ type: "INTRO_DONE" }), []),
    aiResponse: useCallback(
      (aiMessage, turnIndex, isComplete, questionId, badge) =>
        dispatch({ type: "AI_RESPONSE", aiMessage, turnIndex, isComplete, questionId, badge }),
      []
    ),
    aiSpeakDone: useCallback(() => dispatch({ type: "AI_SPEAK_DONE" }), []),
    userSubmit: useCallback(
      (answerText) => dispatch({ type: "USER_SUBMIT", answerText }),
      []
    ),
    onClosingDone: useCallback(() => dispatch({ type: "CLOSING_DONE" }), []),
    reset: useCallback(() => dispatch({ type: "RESET" }), []),
  };

  return [state, actions];
}
