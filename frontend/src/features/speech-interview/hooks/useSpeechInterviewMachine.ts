"use client";

import { useCallback, useReducer } from "react";
import type { SpeechInterviewSession, SpeechInterviewQuestion } from "../api/types";

// ── 상태 정의 ──────────────────────────────────────────────

export type InterviewMode = "voice" | "text";

export type InterviewPhase =
  | "LOBBY"
  | "INTRO"
  | "QUESTION_READ"
  | "ANSWERING"
  | "TRANSITION"
  | "CLOSING"
  | "REPORT";

export type AnswerRecord = {
  questionId: number;
  question: string;
  badge: string;
  answerText: string;
  answeredAt: string;
};

export type SpeechInterviewState = {
  phase: InterviewPhase;
  speechSession: SpeechInterviewSession | null;
  questions: SpeechInterviewQuestion[];
  currentIndex: number;
  answers: AnswerRecord[];
  mode: InterviewMode;
  useCamera: boolean;
  isTransitioning: boolean;
};

// ── 액션 정의 ──────────────────────────────────────────────

type Action =
  | { type: "SESSION_CREATED"; session: SpeechInterviewSession; mode: InterviewMode; useCamera: boolean }
  | { type: "START_INTRO" }
  | { type: "INTRO_DONE" }
  | { type: "QUESTION_DONE" }
  | { type: "SUBMIT_ANSWER"; answerText: string }
  | { type: "TRANSITION_DONE" }
  | { type: "CLOSING_DONE" }
  | { type: "RESET" };

// ── 초기 상태 ──────────────────────────────────────────────

const INITIAL: SpeechInterviewState = {
  phase: "LOBBY",
  speechSession: null,
  questions: [],
  currentIndex: 0,
  answers: [],
  mode: "voice",
  useCamera: false,
  isTransitioning: false,
};

// ── 리듀서 ──────────────────────────────────────────────────

function reducer(state: SpeechInterviewState, action: Action): SpeechInterviewState {
  switch (action.type) {
    case "SESSION_CREATED": {
      return {
        ...state,
        speechSession: action.session,
        questions: action.session.questions,
        currentIndex: 0,
        answers: [],
        mode: action.mode,
        useCamera: action.useCamera,
        isTransitioning: false,
      };
    }

    case "START_INTRO":
      return { ...state, phase: "INTRO" };

    case "INTRO_DONE":
      return { ...state, phase: "QUESTION_READ" };

    case "QUESTION_DONE":
      return { ...state, phase: "ANSWERING" };

    case "SUBMIT_ANSWER": {
      if (state.isTransitioning) return state;
      if (state.phase !== "ANSWERING") return state;

      const currentQ = state.questions[state.currentIndex];
      if (!currentQ) return state;

      const newAnswer: AnswerRecord = {
        questionId: currentQ.id,
        question: currentQ.questionText,
        badge: currentQ.badge,
        answerText: action.answerText.trim(),
        answeredAt: new Date().toISOString(),
      };

      return {
        ...state,
        phase: "TRANSITION",
        answers: [...state.answers, newAnswer],
        isTransitioning: true,
      };
    }

    case "TRANSITION_DONE": {
      const nextIndex = state.currentIndex + 1;
      const hasMore = nextIndex < state.questions.length;
      return {
        ...state,
        currentIndex: hasMore ? nextIndex : state.currentIndex,
        phase: hasMore ? "QUESTION_READ" : "CLOSING",
        isTransitioning: false,
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
  sessionCreated: (session: SpeechInterviewSession, mode: InterviewMode, useCamera: boolean) => void;
  startIntro: () => void;
  onIntroDone: () => void;
  onQuestionDone: () => void;
  submitAnswer: (answerText: string) => void;
  onTransitionDone: () => void;
  onClosingDone: () => void;
  reset: () => void;
};

export function useSpeechInterviewMachine(): [SpeechInterviewState, SpeechInterviewActions] {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  const actions: SpeechInterviewActions = {
    sessionCreated: useCallback(
      (session, mode, useCamera) =>
        dispatch({ type: "SESSION_CREATED", session, mode, useCamera }),
      []
    ),
    startIntro: useCallback(() => dispatch({ type: "START_INTRO" }), []),
    onIntroDone: useCallback(() => dispatch({ type: "INTRO_DONE" }), []),
    onQuestionDone: useCallback(() => dispatch({ type: "QUESTION_DONE" }), []),
    submitAnswer: useCallback(
      (answerText) => dispatch({ type: "SUBMIT_ANSWER", answerText }),
      []
    ),
    onTransitionDone: useCallback(() => dispatch({ type: "TRANSITION_DONE" }), []),
    onClosingDone: useCallback(() => dispatch({ type: "CLOSING_DONE" }), []),
    reset: useCallback(() => dispatch({ type: "RESET" }), []),
  };

  return [state, actions];
}
