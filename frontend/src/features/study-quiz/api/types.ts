export type CsQuizDifficulty = "LOW" | "MID" | "HIGH";

export type CsQuizTopic =
  | "OS"
  | "NETWORK"
  | "DB"
  | "SPRING"
  | "JAVA"
  | "DATA_STRUCTURE"
  | "ALGORITHM"
  | "ARCHITECTURE"
  | "CLOUD";

export type CsQuizQuestionType = "MULTIPLE_CHOICE" | "SHORT_ANSWER";
export type CsQuizSessionStatus = "CREATED" | "QUESTIONS_READY" | "FAILED";

export type CsQuizQuestion = {
  id: number;
  orderIndex: number;
  topic: CsQuizTopic;
  difficulty: CsQuizDifficulty;
  type: CsQuizQuestionType;
  prompt: string;
  choices: string[];
  createdAt: string;
};

export type CsQuizSession = {
  id: number;
  title: string;
  difficulty: CsQuizDifficulty;
  topics: CsQuizTopic[];
  status: CsQuizSessionStatus;
  questions: CsQuizQuestion[];
  createdAt: string;
  updatedAt: string;
};

export type CsQuizAttempt = {
  attemptId: number;
  createdAt: string;
  correct: boolean | null;
  strengths: string[];
  improvements: string[];
  suggestedAnswer: string | null;
  followups: string[];
};

export type TopicAccuracy = {
  topic: string;
  totalAttempts: number;
  correctCount: number;
  accuracy: number;
};

export type CsQuizStatsResponse = {
  totalAttempts: number;
  correctCount: number;
  overallAccuracy: number;
  topicAccuracies: TopicAccuracy[];
};

