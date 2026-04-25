package com.devweb.api.resume.session.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Schema(description = "공고-이력서 매칭 분석 요청")
public record JdMatchRequest(
        @NotNull
        @Schema(description = "분석할 이력서 ID", example = "1")
        Long resumeId,

        @Schema(description = "포트폴리오 파일 ID (선택)", example = "2")
        Long portfolioResumeId,

        @NotBlank
        @Size(max = 5000, message = "채용공고 텍스트는 5000자 이내로 입력해주세요.")
        @Schema(description = "채용공고(JD) 텍스트", example = "Java 백엔드 개발자 채용합니다...")
        String jdText
) {}
