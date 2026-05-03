// SpeechInterview 도메인 독립 타입 — resume 도메인 타입 의존 없음

export type SpeechInterviewQuestion = {
  id: number;
  orderIndex: number;
  badge: string;
  questionText: string;
  answer?: SpeechInterviewAnswer;
};

export type SpeechInterviewAnswer = {
  answerText: string;
  feedbackStatus: "PENDING" | "COMPLETED" | "FAILED";
  behavioralMetrics?: BehavioralMetricsDto;
  feedback?: SpeechFeedback;
};

export type BehavioralMetricsDto = {
  eyeContactRatio: number;
  postureStability: number;
  expressionVariety: number;
  fidgetingScore: number;
};

export type SpeechFeedback = {
  strengths: string[];
  improvements: string[];
  suggestedAnswer: string;
  followups: string[];
  deliveryStrengths?: string[];
  deliveryImprovements?: string[];
};

export type SpeechInterviewSession = {
  id: number;
  title: string;
  positionType: string | null;
  useCamera: boolean;
  status: "CREATED" | "COMPLETED";
  createdAt: string;
  completedAt?: string;
  questions: SpeechInterviewQuestion[];
};

export type SubmitAnswerRequest = {
  questionId: number;
  answerText: string;
  behavioralMetrics?: BehavioralMetricsDto;
};
