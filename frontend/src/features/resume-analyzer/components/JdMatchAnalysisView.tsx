"use client";

import { useState } from "react";
import { useResumeFiles } from "@/features/profile/hooks/useResumeFiles";
import { useJdMatchAnalysis } from "../hooks/useJdMatchAnalysis";
import type { JdMatchAnalysis, MissingKeyword } from "../api/types";
import { cn } from "@/lib/utils";

function matchRateColor(rate: number): { bar: string; text: string; bg: string } {
  if (rate >= 80) return { bar: "bg-[oklch(0.52_0.18_150)]", text: "text-[oklch(0.52_0.18_150)]", bg: "bg-[oklch(0.52_0.18_150)]/10" };
  if (rate >= 60) return { bar: "bg-amber-500", text: "text-amber-600", bg: "bg-amber-500/10" };
  return { bar: "bg-destructive", text: "text-destructive", bg: "bg-destructive/10" };
}

function importanceBadge(importance: MissingKeyword["importance"]) {
  switch (importance) {
    case "HIGH": return "bg-destructive/10 text-destructive";
    case "MID": return "bg-amber-500/10 text-amber-600";
    default: return "bg-muted text-muted-foreground";
  }
}

function importanceLabel(importance: MissingKeyword["importance"]) {
  switch (importance) {
    case "HIGH": return "필수";
    case "MID": return "권장";
    default: return "선택";
  }
}

export function JdMatchAnalysisView() {
  const { data: files } = useResumeFiles();
  const analysisMutation = useJdMatchAnalysis();

  const resumeFiles = files?.filter((f) => f.fileType === "RESUME" && f.extractStatus === "EXTRACTED") ?? [];
  const portfolioFiles = files?.filter((f) => f.fileType === "PORTFOLIO" && f.extractStatus === "EXTRACTED") ?? [];

  const [resumeId, setResumeId] = useState<string>("");
  const [portfolioResumeId, setPortfolioResumeId] = useState<string>("");
  const [jdText, setJdText] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resumeId) return;
    analysisMutation.mutate({
      resumeId: Number(resumeId),
      portfolioResumeId: portfolioResumeId ? Number(portfolioResumeId) : null,
      jdText,
    });
  }

  const result = analysisMutation.data;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-foreground">공고 매칭 분석</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          이력서와 채용공고를 AI가 대조해 매칭률·보완 키워드를 알려드립니다.
        </p>
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Resume select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">이력서 선택 *</label>
            <select
              value={resumeId}
              onChange={(e) => setResumeId(e.target.value)}
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              required
            >
              <option value="">이력서를 선택하세요</option>
              {resumeFiles.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.title}
                </option>
              ))}
            </select>
            {resumeFiles.length === 0 && (
              <p className="text-[11px] text-destructive">
                추출 완료된 이력서가 없습니다. 프로필에서 업로드하세요.
              </p>
            )}
          </div>

          {/* Portfolio select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">포트폴리오 선택 (선택)</label>
            <select
              value={portfolioResumeId}
              onChange={(e) => setPortfolioResumeId(e.target.value)}
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">없음</option>
              {portfolioFiles.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* JD textarea */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted-foreground">
            채용공고(JD) 텍스트 *
            <span className="ml-2 font-normal text-muted-foreground/70">
              {jdText.length}/5000
            </span>
          </label>
          <textarea
            value={jdText}
            onChange={(e) => setJdText(e.target.value.slice(0, 5000))}
            placeholder="채용공고 전문을 여기에 붙여넣으세요. (직무 설명, 자격 요건, 우대 사항 포함)"
            rows={8}
            required
            className="resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <button
          type="submit"
          disabled={analysisMutation.isPending || !resumeId || !jdText.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 self-start"
        >
          {analysisMutation.isPending ? (
            <>
              <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
              분석 중...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-sm">smart_toy</span>
              AI 분석 시작
            </>
          )}
        </button>

        {analysisMutation.isError && (
          <p className="text-sm text-destructive">
            {analysisMutation.error instanceof Error
              ? analysisMutation.error.message
              : "분석에 실패했습니다. 다시 시도해주세요."}
          </p>
        )}
      </form>

      {/* Result */}
      {result && <AnalysisResult result={result} />}
    </div>
  );
}

function AnalysisResult({ result }: { result: JdMatchAnalysis }) {
  const colors = matchRateColor(result.matchRate);

  return (
    <div className="flex flex-col gap-4">
      {/* Match rate card */}
      <div className={cn("flex items-center gap-5 rounded-xl border border-border bg-card p-5", colors.bg)}>
        <div className="flex flex-col items-center">
          <span className={cn("text-5xl font-black tabular-nums", colors.text)}>
            {result.matchRate}
          </span>
          <span className={cn("text-xs font-semibold", colors.text)}>%</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">매칭률</p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full transition-all duration-500", colors.bar)}
              style={{ width: `${result.matchRate}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{result.summary}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Matched keywords */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[oklch(0.52_0.18_150)]">check_circle</span>
            <h3 className="text-sm font-semibold text-foreground">매칭 키워드</h3>
            <span className="ml-auto text-xs text-muted-foreground">{result.matchedKeywords.length}개</span>
          </div>
          {result.matchedKeywords.length === 0 ? (
            <p className="text-sm text-muted-foreground">매칭 키워드가 없습니다.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {result.matchedKeywords.map((kw, i) => (
                <span
                  key={i}
                  title={kw.category}
                  className="rounded-md bg-[oklch(0.52_0.18_150)]/10 px-2.5 py-1 text-xs font-semibold text-[oklch(0.52_0.18_150)]"
                >
                  {kw.keyword}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Missing keywords */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-amber-500">warning</span>
            <h3 className="text-sm font-semibold text-foreground">보완 필요 키워드</h3>
            <span className="ml-auto text-xs text-muted-foreground">{result.missingKeywords.length}개</span>
          </div>
          {result.missingKeywords.length === 0 ? (
            <p className="text-sm text-muted-foreground">부족한 키워드가 없습니다.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {result.missingKeywords.map((kw, i) => (
                <div key={i} className="rounded-lg border border-border bg-background p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">{kw.keyword}</span>
                    <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold", importanceBadge(kw.importance))}>
                      {importanceLabel(kw.importance)}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">{kw.suggestion}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">tips_and_updates</span>
            <h3 className="text-sm font-semibold text-foreground">AI 보완 제안</h3>
          </div>
          <ol className="flex flex-col gap-2">
            {result.recommendations.map((rec, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                  {i + 1}
                </span>
                <p className="text-sm text-foreground leading-relaxed">{rec}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
