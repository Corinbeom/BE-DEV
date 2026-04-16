export type PositionType = string;

export type ResumeSessionStatus =
  | "CREATED"
  | "EXTRACTED"
  | "QUESTIONS_READY"
  | "COMPLETED"
  | "FAILED";

export type ResumeFeedback = {
  attemptId: number;
  createdAt: string;
  answerText: string;
  strengths: string[];
  improvements: string[];
  suggestedAnswer: string | null;
  followups: string[];
};

export type ResumeQuestion = {
  id: number;
  orderIndex: number;
  badge: string;
  likelihood: number;
  question: string | null;
  intention: string | null;
  keywords: string | null;
  modelAnswer: string | null;
  attempts: ResumeFeedback[];
};

export type ResumeSession = {
  id: number;
  title: string;
  positionType: string | null;
  portfolioUrl: string | null;
  status: ResumeSessionStatus;
  questions: ResumeQuestion[];
  totalQuestionCount: number;
  answeredQuestionCount: number;
  lastAttemptAt: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  hasReport: boolean;
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

export type SessionReportBadgeSummary = {
  badge: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
};

export type SessionReportImprovement = {
  title: string;
  description: string;
};

export type SessionReport = {
  executiveSummary: string;
  badgeSummaries: SessionReportBadgeSummary[];
  repeatedGaps: string[];
  topImprovements: SessionReportImprovement[];
  overallScore: number;
  closingAdvice: string;
};

export type ResumeInterviewStats = {
  totalQuestions: number;
  attemptedQuestions: number;
  practiceRate: number;
  badgeStats: BadgeStats[];
  weeklyTrends: WeeklyTrend[];
};

