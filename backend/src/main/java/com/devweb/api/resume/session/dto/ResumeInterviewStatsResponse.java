package com.devweb.api.resume.session.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.io.Serializable;
import java.util.List;

@Schema(description = "면접 연습 통계 응답")
public record ResumeInterviewStatsResponse(
        @Schema(description = "전체 생성된 질문 수", example = "30")
        int totalQuestions,
        @Schema(description = "답변한 질문 수", example = "18")
        int attemptedQuestions,
        @Schema(description = "연습률 (0~1)", example = "0.6")
        double practiceRate,
        @Schema(description = "배지별 통계")
        List<BadgeStats> badgeStats,
        @Schema(description = "주간 추이 (ISO Monday 기준)")
        List<WeeklyTrend> weeklyTrends
) implements Serializable {

    @Schema(description = "배지별 면접 연습 통계")
    public record BadgeStats(
            @Schema(description = "배지명", example = "프로젝트 기반")
            String badge,
            @Schema(description = "생성된 질문 수", example = "8")
            int totalQuestions,
            @Schema(description = "답변한 질문 수", example = "5")
            int attemptedQuestions,
            @Schema(description = "연습률 (0~1)", example = "0.625")
            double practiceRate,
            @Schema(description = "평균 강점 개수", example = "2.4")
            double avgStrengths,
            @Schema(description = "평균 개선점 개수", example = "1.8")
            double avgImprovements,
            @Schema(description = "빈출 강점 Top 3")
            List<FrequentItem> topStrengths,
            @Schema(description = "빈출 개선점 Top 3")
            List<FrequentItem> topImprovements
    ) implements Serializable {}

    @Schema(description = "빈출 피드백 항목")
    public record FrequentItem(
            @Schema(description = "피드백 텍스트", example = "명확한 문제 해결 접근법")
            String text,
            @Schema(description = "빈도 수", example = "5")
            int frequency
    ) implements Serializable {}

    @Schema(description = "주간 추이 데이터")
    public record WeeklyTrend(
            @Schema(description = "주 시작일 (ISO Monday)", example = "2026-03-23")
            String weekStart,
            @Schema(description = "답변 시도 수", example = "12")
            int attemptCount,
            @Schema(description = "평균 강점 개수", example = "2.1")
            double avgStrengths,
            @Schema(description = "평균 개선점 개수", example = "1.5")
            double avgImprovements
    ) implements Serializable {}
}
