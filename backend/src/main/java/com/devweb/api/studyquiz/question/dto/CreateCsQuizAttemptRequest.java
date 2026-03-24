package com.devweb.api.studyquiz.question.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "CS 퀴즈 답변 제출 요청")
public record CreateCsQuizAttemptRequest(
        @Schema(description = "객관식 선택지 인덱스 (0부터 시작)", example = "2")
        Integer selectedChoiceIndex,
        @Schema(description = "주관식 답변 텍스트", example = "TCP는 연결 지향 프로토콜입니다.")
        String answerText
) {
}
