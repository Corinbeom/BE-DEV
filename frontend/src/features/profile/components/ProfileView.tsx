"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  useResumeFiles,
  useUploadResumeFile,
  useDeleteResumeFile,
} from "../hooks/useResumeFiles";
import type { ResumeFile, ResumeFileType } from "../api/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function formatBytes(bytes: number | null): string {
  if (bytes == null) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileCard({
  file,
  onDelete,
  isDeleting,
}: {
  file: ResumeFile;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  return (
    <Card className="group transition-all hover:shadow-md">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-lg",
              file.fileType === "RESUME"
                ? "bg-primary/10 text-primary"
                : "bg-violet-500/10 text-violet-600"
            )}
          >
            <span className="material-symbols-outlined">
              {file.fileType === "RESUME" ? "description" : "folder_open"}
            </span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {file.title}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {file.originalFilename} · {formatBytes(file.sizeBytes)}
            </p>
            <div className="mt-1">
              <Badge
                variant={
                  file.extractStatus === "EXTRACTED"
                    ? "default"
                    : file.extractStatus === "FAILED"
                      ? "destructive"
                      : "secondary"
                }
                className="text-[10px]"
              >
                {file.extractStatus === "EXTRACTED"
                  ? "텍스트 추출 완료"
                  : file.extractStatus === "FAILED"
                    ? "추출 실패"
                    : "추출 대기"}
              </Badge>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          disabled={isDeleting}
          className="ml-4 text-muted-foreground hover:text-destructive"
          aria-label="삭제"
          title="삭제"
        >
          <span className="material-symbols-outlined text-lg">delete</span>
        </Button>
      </CardContent>
    </Card>
  );
}

export function ProfileView() {
  const { user } = useAuth();
  const displayName = user?.displayName ?? user?.email ?? "사용자";
  const initial = displayName.charAt(0).toUpperCase();

  const { data: files, isLoading } = useResumeFiles();
  const uploadMutation = useUploadResumeFile();
  const deleteMutation = useDeleteResumeFile();

  const [uploadType, setUploadType] = useState<ResumeFileType>("RESUME");
  const [uploadTitle, setUploadTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const resumeFiles = files?.filter((f) => f.fileType === "RESUME") ?? [];
  const portfolioFiles =
    files?.filter((f) => f.fileType === "PORTFOLIO") ?? [];

  async function onUpload() {
    if (!selectedFile) return;
    await uploadMutation.mutateAsync({
      file: selectedFile,
      fileType: uploadType,
      title: uploadTitle.trim() || undefined,
    });
    setSelectedFile(null);
    setUploadTitle("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-8">
      {/* User Info */}
      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
        <CardContent className="relative px-6 pb-6">
          <div className="-mt-10 flex items-end gap-4">
            <Avatar className="size-20 border-4 border-background shadow-lg">
              <AvatarImage
                src={user?.photoUrl ?? undefined}
                alt={displayName}
              />
              <AvatarFallback className="bg-primary text-2xl font-bold text-primary-foreground">
                {initial}
              </AvatarFallback>
            </Avatar>
            <div className="pb-1">
              <p className="text-xl font-bold text-foreground">{displayName}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <span className="material-symbols-outlined">upload_file</span>
            </div>
            <h3 className="text-lg font-bold text-foreground">파일 업로드</h3>
          </div>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  파일 유형
                </span>
                <select
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/20"
                  value={uploadType}
                  onChange={(e) =>
                    setUploadType(e.target.value as ResumeFileType)
                  }
                >
                  <option value="RESUME">이력서</option>
                  <option value="PORTFOLIO">포트폴리오</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  제목 (선택)
                </span>
                <Input
                  placeholder="예: 2026 상반기 백엔드 이력서"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                />
              </label>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setSelectedFile(f);
              }}
            />
            <div
              className="cursor-pointer rounded-xl border-2 border-dashed border-border bg-muted/30 p-8 transition-all hover:border-primary/40 hover:bg-primary/5"
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  fileInputRef.current?.click();
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0] ?? null;
                if (f) setSelectedFile(f);
              }}
            >
              <div className="flex flex-col items-center justify-center gap-2">
                <span className="material-symbols-outlined text-4xl text-muted-foreground/50">
                  cloud_upload
                </span>
                <p className="text-center text-sm text-muted-foreground">
                  PDF 또는 TXT 파일을 여기로 끌어오거나,{" "}
                  <span className="font-semibold text-primary underline">
                    파일 찾아보기
                  </span>
                </p>
                {selectedFile ? (
                  <Badge variant="secondary" className="mt-1">
                    {selectedFile.name} ({formatBytes(selectedFile.size)})
                  </Badge>
                ) : null}
                <p className="text-xs text-muted-foreground/70">
                  최대 파일 크기: 5MB
                </p>
              </div>
            </div>

            <Button
              className="w-full gap-2"
              disabled={!selectedFile || uploadMutation.isPending}
              onClick={() => void onUpload()}
            >
              {uploadMutation.isPending ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm">
                    progress_activity
                  </span>
                  업로드 중...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">
                    upload
                  </span>
                  업로드
                </>
              )}
            </Button>
            {uploadMutation.error ? (
              <p className="text-sm font-semibold text-destructive">
                업로드 오류:{" "}
                {uploadMutation.error instanceof Error
                  ? uploadMutation.error.message
                  : String(uploadMutation.error)}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Resume Files */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <span className="material-symbols-outlined">description</span>
            </div>
            <h3 className="text-lg font-bold text-foreground">이력서</h3>
            <Badge variant="secondary">{resumeFiles.length}개</Badge>
          </div>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="material-symbols-outlined animate-spin text-sm">
                progress_activity
              </span>
              불러오는 중...
            </div>
          ) : resumeFiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              아직 업로드한 이력서가 없어요.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {resumeFiles.map((f) => (
                <FileCard
                  key={f.id}
                  file={f}
                  onDelete={() => deleteMutation.mutate(f.id)}
                  isDeleting={deleteMutation.isPending}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Portfolio Files */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600">
              <span className="material-symbols-outlined">folder_open</span>
            </div>
            <h3 className="text-lg font-bold text-foreground">포트폴리오</h3>
            <Badge variant="secondary">{portfolioFiles.length}개</Badge>
          </div>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="material-symbols-outlined animate-spin text-sm">
                progress_activity
              </span>
              불러오는 중...
            </div>
          ) : portfolioFiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              아직 업로드한 포트폴리오가 없어요.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {portfolioFiles.map((f) => (
                <FileCard
                  key={f.id}
                  file={f}
                  onDelete={() => deleteMutation.mutate(f.id)}
                  isDeleting={deleteMutation.isPending}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
