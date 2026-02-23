export type PositionType = "BE" | "FE" | "MOBILE";

export type ResumeSessionStatus =
  | "CREATED"
  | "EXTRACTED"
  | "QUESTIONS_READY"
  | "FAILED";

export type ResumeQuestion = {
  id: number;
  orderIndex: number;
  badge: string;
  likelihood: number;
  question: string | null;
  intention: string | null;
  keywords: string | null;
  modelAnswer: string | null;
};

export type ResumeSession = {
  id: number;
  title: string;
  positionType: string | null;
  portfolioUrl: string | null;
  status: ResumeSessionStatus;
  questions: ResumeQuestion[];
  createdAt: string;
  updatedAt: string;
};

export type ResumeFeedback = {
  attemptId: number;
  createdAt: string;
  strengths: string[];
  improvements: string[];
  suggestedAnswer: string | null;
  followups: string[];
};

