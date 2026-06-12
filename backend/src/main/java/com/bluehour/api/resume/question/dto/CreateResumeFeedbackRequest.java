package com.bluehour.api.resume.question.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "면접 질문 답변 제출 요청")
public record CreateResumeFeedbackRequest(
        @Schema(description = "답변 텍스트", example = "저는 Spring Boot를 활용한 REST API 개발 경험이 있습니다.")
        @NotBlank String answerText,

        @Schema(description = "비언어 행동 분석 지표 (모의 면접 시 선택적 제공)", nullable = true)
        BehavioralMetricsDto behavioralMetrics
) {
    @Schema(description = "브라우저 행동 분석 지표 (0.0~1.0)")
    public record BehavioralMetricsDto(
            @Schema(description = "시선 안정성 비율", example = "0.72") Double eyeContactRatio,
            @Schema(description = "자세 안정성 비율", example = "0.85") Double postureStability,
            @Schema(description = "표정 다양성 비율", example = "0.55") Double expressionVariety,
            @Schema(description = "불안 움직임 점수 (낮을수록 좋음)", example = "0.21") Double fidgetingScore
    ) {}
}
