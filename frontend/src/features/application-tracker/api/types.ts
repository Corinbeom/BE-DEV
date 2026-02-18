export type RecruitmentStep =
  | "READY"
  | "APPLIED"
  | "DOC_PASSED"
  | "TEST_PHASE"
  | "INTERVIEWING"
  | "OFFERED"
  | "REJECTED"
  | "ON_HOLD";

export type PlatformType = "MANUAL";

export type RecruitmentEntry = {
  id: number;
  memberId: number;
  companyName: string;
  position: string;
  step: RecruitmentStep;
  platformType: PlatformType;
  externalId: string | null;
};


