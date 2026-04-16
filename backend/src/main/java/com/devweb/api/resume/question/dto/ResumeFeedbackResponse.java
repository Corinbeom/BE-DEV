package com.devweb.api.resume.question.dto;

import com.devweb.domain.resume.session.model.Feedback;
import com.devweb.domain.resume.session.model.ResumeAnswerAttempt;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
import java.util.List;

@Schema(description = "면접 질문 피드백 응답")
public record ResumeFeedbackResponse(
        @Schema(description = "답변 ID", example = "1")
        Long attemptId,
        @Schema(description = "제출 일시")
        LocalDateTime createdAt,
        @Schema(description = "사용자가 제출한 답변 본문")
        String answerText,
        @Schema(description = "강점 피드백")
        List<String> strengths,
        @Schema(description = "개선점 피드백")
        List<String> improvements,
        @Schema(description = "AI 모범답안", example = "프로젝트에서 Spring Security를 활용하여...")
        String suggestedAnswer,
        @Schema(description = "추가 학습 질문")
        List<String> followups
) implements java.io.Serializable {
    public static ResumeFeedbackResponse from(ResumeAnswerAttempt attempt) {
        Feedback f = attempt.getFeedback();
        return new ResumeFeedbackResponse(
                attempt.getId(),
                attempt.getCreatedAt(),
                attempt.getAnswerText(),
                f == null ? List.of() : f.getStrengths(),
                f == null ? List.of() : f.getImprovements(),
                f == null ? null : f.getSuggestedAnswer(),
                f == null ? List.of() : f.getFollowups()
        );
    }
}
