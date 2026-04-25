package com.devweb.api.resume.session.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

@Schema(description = "공고-이력서 매칭 분석 결과")
public record JdMatchAnalysisResponse(
        @Schema(description = "매칭률 (0~100)", example = "75")
        int matchRate,

        @Schema(description = "매칭 키워드 목록")
        List<MatchedKeyword> matchedKeywords,

        @Schema(description = "부족 키워드 목록")
        List<MissingKeyword> missingKeywords,

        @Schema(description = "종합 분석 요약")
        String summary,

        @Schema(description = "보완 제안 목록")
        List<String> recommendations
) {
    public record MatchedKeyword(
            @Schema(description = "키워드", example = "Spring Boot")
            String keyword,

            @Schema(description = "분류", example = "기술 스택")
            String category
    ) {}

    public record MissingKeyword(
            @Schema(description = "부족 키워드", example = "Kubernetes")
            String keyword,

            @Schema(description = "중요도 (HIGH/MID/LOW)", example = "HIGH")
            String importance,

            @Schema(description = "보완 방법 제안")
            String suggestion
    ) {}
}
