package com.devweb.api.speechinterview.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SubmitSpeechAnswerRequest(
        @NotNull Long questionId,
        @NotBlank String answerText,
        BehavioralMetricsDto behavioralMetrics
) {
    public record BehavioralMetricsDto(
            Double eyeContactRatio,
            Double postureStability,
            Double expressionVariety,
            Double fidgetingScore
    ) {
    }
}
