package com.devweb.api.resume.question.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "면접 질문 답변 제출 요청")
public record CreateResumeFeedbackRequest(
        @Schema(description = "답변 텍스트", example = "저는 Spring Boot를 활용한 REST API 개발 경험이 있습니다.")
        @NotBlank String answerText
) {
}
