"use client";

import { useCallback, useReducer } from "react";
import type { ResumeQuestion, ResumeSession } from "@/features/resume-analyzer/api/types";

// ── 상태 정의 ────────────────────────────────────────────

export type InterviewMode = "voice" | "text"; // 카메라: useBehavioralAnalysis 별도 처리

export type InterviewPhase =
  | "LOBBY"           // 세션 선택 + 권한 체크
  | "INTRO"           // "면접을 시작합니다" TTS
  | "QUESTION_READ"   // 질문 TTS 재생 중
  | "ANSWERING"       // STT/텍스트 녹음
  | "TRANSITION"      // 답변 저장 + 다음 질문 준비
  | "CLOSING"         // "면접이 종료되었습니다" TTS
  | "REPORT";         // 최종 결과

export type AnswerRecord = {
  questionId: number;
  question: string;
  badge: string;
  answerText: string;
  answeredAt: string;
};

export type InterviewState = {
  phase: InterviewPhase;
  session: ResumeSession | null;
  questions: ResumeQuestion[];   // 답변 대기 큐 (answered 제외 + null question 제외)
  currentIndex: number;          // 현재 질문 인덱스 (0-based)
  answers: AnswerRecord[];
  mode: InterviewMode;
  useCamera: boolean;
  isTransitioning: boolean;      // ANSWERING → TRANSITION 중복 방지
};

// ── 액션 정의 ────────────────────────────────────────────

type Action =
  | { type: "SELECT_SESSION"; session: ResumeSession; mode: InterviewMode; useCamera: boolean }
  | { type: "START_INTRO" }
  | { type: "INTRO_DONE" }
  | { type: "QUESTION_DONE" }
  | { type: "SUBMIT_ANSWER"; answerText: string }
  | { type: "TRANSITION_DONE" }
  | { type: "CLOSING_DONE" }
  | { type: "RESET" };

// ── 초기 상태 ────────────────────────────────────────────

const INITIAL: InterviewState = {
  phase: "LOBBY",
  session: null,
  questions: [],
  currentIndex: 0,
  answers: [],
  mode: "voice",
  useCamera: false,
  isTransitioning: false,
};

// ── 리듀서 ────────────────────────────────────────────────

function reducer(state: InterviewState, action: Action): InterviewState {
  switch (action.type) {
    case "SELECT_SESSION": {
      // null question 필터링 (질문 생성 중 상태 제외)
      const validQuestions = action.session.questions.filter(
        (q) => q.question && q.question.trim().length > 0
      );
      return {
        ...state,
        session: action.session,
        questions: validQuestions,
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
      // race condition 방지: 이미 transition 중이면 무시
      if (state.isTransitioning) return state;
      if (state.phase !== "ANSWERING") return state;

      const currentQ = state.questions[state.currentIndex];
      if (!currentQ) return state;

      const newAnswer: AnswerRecord = {
        questionId: currentQ.id,
        question: currentQ.question!,
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

// ── 훅 ───────────────────────────────────────────────────

export type MockInterviewActions = {
  selectSession: (session: ResumeSession, mode: InterviewMode, useCamera: boolean) => void;
  startIntro: () => void;
  onIntroDone: () => void;
  onQuestionDone: () => void;
  submitAnswer: (answerText: string) => void;
  onTransitionDone: () => void;
  onClosingDone: () => void;
  reset: () => void;
};

export function useMockInterview(): [InterviewState, MockInterviewActions] {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  const actions: MockInterviewActions = {
    selectSession: useCallback(
      (session, mode, useCamera) =>
        dispatch({ type: "SELECT_SESSION", session, mode, useCamera }),
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
