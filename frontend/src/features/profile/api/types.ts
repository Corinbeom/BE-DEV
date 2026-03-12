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
