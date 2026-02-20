export type RecruitmentStep =
  | "READY"
  | "APPLIED"
  | "DOC_PASSED"
  | "TEST_PHASE"
  | "INTERVIEWING"
  | "OFFERED"
  | "REJECTED"
  | "ON_HOLD";

export type PlatformType =
  | "MANUAL"
  | "WANTED"
  | "LINKEDIN"
  | "JOBKOREA"
  | "SARMIN"
  | "REMEMBER"
  | "JUMPIT"
  | "ROCKETPUNCH"
  | "PROGRAMMERS"
  | "ETC";

export type RecruitmentEntry = {
  id: number;
  memberId: number;
  companyName: string;
  position: string;
  step: RecruitmentStep;
  platformType: PlatformType;
  externalId: string | null;
  appliedDate?: string | null; // yyyy-MM-dd (backend LocalDate)
};


