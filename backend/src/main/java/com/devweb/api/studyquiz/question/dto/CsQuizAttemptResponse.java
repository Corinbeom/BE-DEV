package com.devweb.api.studyquiz.question.dto;

import com.devweb.domain.studyquiz.session.model.CsQuizAttempt;
import com.devweb.domain.studyquiz.session.model.CsQuizFeedback;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
import java.util.List;

@Schema(description = "CS 퀴즈 답변 결과")
public record CsQuizAttemptResponse(
        @Schema(description = "답변 ID", example = "1")
        Long attemptId,
        @Schema(description = "제출 일시")
        LocalDateTime createdAt,
        @Schema(description = "정답 여부", example = "true")
        Boolean correct,
        @Schema(description = "강점 피드백")
        List<String> strengths,
        @Schema(description = "개선점 피드백")
        List<String> improvements,
        @Schema(description = "AI 모범답안", example = "TCP는 3-way handshake를 통해 연결을 수립합니다.")
        String suggestedAnswer,
        @Schema(description = "추가 학습 질문")
        List<String> followups
) {
    public static CsQuizAttemptResponse from(CsQuizAttempt attempt) {
        CsQuizFeedback f = attempt.getFeedback();
        return new CsQuizAttemptResponse(
                attempt.getId(),
                attempt.getCreatedAt(),
                attempt.isCorrect(),
                f == null ? List.of() : f.getStrengths(),
                f == null ? List.of() : f.getImprovements(),
                f == null ? null : f.getSuggestedAnswer(),
                f == null ? List.of() : f.getFollowups()
        );
    }
}
