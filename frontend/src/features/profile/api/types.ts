export type ResumeFileType = "RESUME" | "PORTFOLIO";

export type ResumeFile = {
  id: number;
  title: string;
  fileType: ResumeFileType;
  originalFilename: string | null;
  contentType: string | null;
  sizeBytes: number | null;
  extractStatus: "PENDING" | "EXTRACTED" | "FAILED";
  createdAt: string;
};

export type InterviewMailSchedule = {
  id: number;
  resumeId: number;
  resumeTitle: string;
  positionType: string;
  sendHour: number;
  enabled: boolean;
  targetTechnologies: string[];
  createdAt: string;
  updatedAt: string;
};

export type UpsertInterviewMailScheduleInput = {
  resumeId: number;
  positionType: string;
  sendHour: number;
  enabled: boolean;
  targetTechnologies: string[];
};
