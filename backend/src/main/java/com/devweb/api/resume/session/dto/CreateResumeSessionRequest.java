package com.devweb.api.resume.session.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

@Schema(description = "이력서 분석 세션 생성 요청")
public record CreateResumeSessionRequest(
        @NotBlank(message = "지원 직무 유형은 필수입니다.")
        @Schema(description = "지원 직무 유형", example = "BACKEND")
        String positionType,
        @NotNull(message = "이력서 ID는 필수입니다.")
        @Schema(description = "사전 업로드된 이력서 ID", example = "1")
        Long resumeId,
        @Schema(description = "사전 업로드된 포트폴리오 ID", example = "2")
        Long portfolioResumeId,
        @Schema(description = "외부 포트폴리오 URL", example = "https://github.com/user/portfolio")
        String portfolioUrl,
        @Schema(description = "세션 제목 (선택)", example = "백엔드 면접 준비")
        String title,
        @Schema(description = "채용공고 기술 스택 (선택)", example = "[\"Redis\", \"Kafka\", \"Docker\"]")
        List<String> targetTechnologies
) {
}
