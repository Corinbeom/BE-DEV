package com.devweb.api.resume.session.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.io.Serializable;
import java.util.List;

@Schema(description = "AI 누적 코칭 리포트")
public record CoachingReportResponse(
        @Schema(description = "전반적 면접 준비 수준 종합 평가")
        String overallAssessment,
        @Schema(description = "성장 궤적 분석")
        String growthTrajectory,
        @Schema(description = "여러 세션에 걸쳐 지속되는 강점")
        List<String> persistentStrengths,
        @Schema(description = "여러 세션에 걸쳐 반복되는 약점")
        List<String> persistentWeaknesses,
        @Schema(description = "우선순위별 학습 계획")
        List<LearningPlanItem> learningPlan,
        @Schema(description = "면접 준비 완성도 (1~10)", example = "7")
        int readinessScore,
        @Schema(description = "다음 면접을 위한 구체적 행동 제안")
        String nextSteps
) implements Serializable {

    public record LearningPlanItem(
            int priority,
            String area,
            String action,
            String reason
    ) implements Serializable {}
}
