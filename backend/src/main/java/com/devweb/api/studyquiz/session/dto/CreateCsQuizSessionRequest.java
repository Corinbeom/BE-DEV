package com.devweb.api.studyquiz.session.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

@Schema(description = "CS 퀴즈 세션 생성 요청")
public record CreateCsQuizSessionRequest(
        @Schema(description = "난이도", example = "MEDIUM")
        @NotBlank String difficulty,
        @Schema(description = "출제 토픽 목록", example = "[\"OS\", \"NETWORK\"]")
        @Size(min = 1) List<String> topics,
        @Schema(description = "문제 수 (5~10)", example = "5")
        @Min(5) @Max(10) int questionCount,
        @Schema(description = "세션 제목 (선택)", example = "네트워크 기초 퀴즈")
        String title
) {
}
