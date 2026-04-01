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

export type FrequentItem = {
  text: string;
  frequency: number;
};

export type WeeklyTrend = {
  weekStart: string;
  attemptCount: number;
  avgStrengths: number;
  avgImprovements: number;
};

export type BadgeStats = {
  badge: string;
  totalQuestions: number;
  attemptedQuestions: number;
  practiceRate: number;
  avgStrengths: number;
  avgImprovements: number;
  topStrengths: FrequentItem[];
  topImprovements: FrequentItem[];
};

export type ResumeInterviewStats = {
  totalQuestions: number;
  attemptedQuestions: number;
  practiceRate: number;
  badgeStats: BadgeStats[];
  weeklyTrends: WeeklyTrend[];
};

