// 기존 resume API를 재사용하는 mock interview 전용 래퍼
export {
  listResumeSessions,
  getResumeSession,
  createResumeFeedback,
} from "@/features/resume-analyzer/api/resumeSessionApi";

export type { ResumeSession, ResumeQuestion } from "@/features/resume-analyzer/api/types";
