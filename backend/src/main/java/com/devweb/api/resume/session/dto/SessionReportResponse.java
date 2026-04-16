package com.devweb.api.resume.session.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.io.Serializable;
import java.util.List;

@Schema(description = "AI 세션 회고 리포트")
public record SessionReportResponse(
        @Schema(description = "전반적인 면접 준비 상태 요약")
        String executiveSummary,
        @Schema(description = "질문 유형별 강점/약점 분석")
        List<BadgeSummary> badgeSummaries,
        @Schema(description = "반복적으로 나타난 역량 갭")
        List<String> repeatedGaps,
        @Schema(description = "Top 3 개선 포인트")
        List<Improvement> topImprovements,
        @Schema(description = "전반적 면접 준비 점수 (1~10)", example = "7")
        int overallScore,
        @Schema(description = "마무리 조언")
        String closingAdvice
) implements Serializable {

    public record BadgeSummary(
            String badge,
            String summary,
            List<String> strengths,
            List<String> weaknesses
    ) implements Serializable {}

    public record Improvement(
            String title,
            String description
    ) implements Serializable {}
}
