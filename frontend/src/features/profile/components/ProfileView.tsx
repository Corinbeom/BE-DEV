"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  useResumeFiles,
  useUploadResumeFile,
  useDeleteResumeFile,
} from "../hooks/useResumeFiles";
import type { ResumeFile, ResumeFileType } from "../api/types";

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
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center gap-3 min-w-0">
        <span className="material-symbols-outlined rounded-lg bg-primary/10 p-2 text-primary">
          {file.fileType === "RESUME" ? "description" : "folder_open"}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
            {file.title}
          </p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            {file.originalFilename} · {formatBytes(file.sizeBytes)}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={[
                "inline-block rounded-full px-2 py-0.5 text-[10px] font-bold",
                file.extractStatus === "EXTRACTED"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : file.extractStatus === "FAILED"
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
              ].join(" ")}
            >
              {file.extractStatus === "EXTRACTED"
                ? "텍스트 추출 완료"
                : file.extractStatus === "FAILED"
                  ? "추출 실패"
                  : "추출 대기"}
            </span>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onDelete}
        disabled={isDeleting}
        className="ml-4 rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:hover:bg-red-900/20"
        aria-label="삭제"
        title="삭제"
      >
        <span className="material-symbols-outlined text-lg">delete</span>
      </button>
    </div>
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
  const portfolioFiles = files?.filter((f) => f.fileType === "PORTFOLIO") ?? [];

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
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          프로필
        </h1>
        <p className="max-w-2xl text-lg text-slate-500 dark:text-slate-400">
          개인 정보와 업로드한 이력서/포트폴리오를 관리할 수 있어요.
        </p>
      </div>

      {/* User Info */}
      <section className="rounded-xl border border-primary/10 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-white/5">
        <div className="flex items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
            {user?.photoUrl ? (
              <img
                src={user.photoUrl}
                alt={displayName}
                className="size-16 rounded-full object-cover"
              />
            ) : (
              initial
            )}
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {displayName}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {user?.email}
            </p>
          </div>
        </div>
      </section>

      {/* File Upload */}
      <section className="rounded-xl border border-primary/10 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-white/5">
        <div className="mb-4 flex items-center gap-3">
          <span className="material-symbols-outlined rounded-lg bg-primary/10 p-2 text-primary">
            upload_file
          </span>
          <h3 className="text-lg font-bold">파일 업로드</h3>
        </div>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                파일 유형
              </span>
              <select
                className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value as ResumeFileType)}
              >
                <option value="RESUME">이력서</option>
                <option value="PORTFOLIO">포트폴리오</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                제목 (선택)
              </span>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:placeholder:text-slate-500"
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
            className="cursor-pointer rounded-xl border-2 border-dashed border-primary/20 bg-slate-50 p-8 transition-colors hover:bg-primary/5 dark:bg-white/5 dark:hover:bg-white/10"
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0] ?? null;
              if (f) setSelectedFile(f);
            }}
          >
            <div className="flex flex-col items-center justify-center">
              <span className="material-symbols-outlined mb-2 text-4xl text-primary/40">
                cloud_upload
              </span>
              <p className="text-center text-sm text-slate-600 dark:text-slate-300">
                PDF 또는 TXT 파일을 여기로 끌어오거나,{" "}
                <span className="font-bold text-primary underline">
                  파일 찾아보기
                </span>
              </p>
              {selectedFile ? (
                <p className="mt-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  선택됨: {selectedFile.name} ({formatBytes(selectedFile.size)})
                </p>
              ) : null}
              <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                최대 파일 크기: 5MB
              </p>
            </div>
          </div>

          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-bold text-white transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
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
          </button>
          {uploadMutation.error ? (
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">
              업로드 오류:{" "}
              {uploadMutation.error instanceof Error
                ? uploadMutation.error.message
                : String(uploadMutation.error)}
            </p>
          ) : null}
        </div>
      </section>

      {/* Resume Files */}
      <section className="rounded-xl border border-primary/10 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-white/5">
        <div className="mb-4 flex items-center gap-3">
          <span className="material-symbols-outlined rounded-lg bg-primary/10 p-2 text-primary">
            description
          </span>
          <h3 className="text-lg font-bold">이력서</h3>
          <span className="rounded bg-primary/10 px-2 py-1 text-xs font-bold text-primary">
            {resumeFiles.length}개
          </span>
        </div>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="material-symbols-outlined animate-spin text-sm">
              progress_activity
            </span>
            불러오는 중...
          </div>
        ) : resumeFiles.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
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
      </section>

      {/* Portfolio Files */}
      <section className="rounded-xl border border-primary/10 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-white/5">
        <div className="mb-4 flex items-center gap-3">
          <span className="material-symbols-outlined rounded-lg bg-primary/10 p-2 text-primary">
            folder_open
          </span>
          <h3 className="text-lg font-bold">포트폴리오</h3>
          <span className="rounded bg-primary/10 px-2 py-1 text-xs font-bold text-primary">
            {portfolioFiles.length}개
          </span>
        </div>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="material-symbols-outlined animate-spin text-sm">
              progress_activity
            </span>
            불러오는 중...
          </div>
        ) : portfolioFiles.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
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
      </section>
    </div>
  );
}
