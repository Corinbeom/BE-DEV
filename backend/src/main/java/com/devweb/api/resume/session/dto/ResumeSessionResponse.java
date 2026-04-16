package com.devweb.api.resume.session.dto;

import com.devweb.domain.resume.session.model.ResumeSession;
import com.devweb.domain.resume.session.model.ResumeSessionStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Schema(description = "이력서 분석 세션 응답")
public record ResumeSessionResponse(
        @Schema(description = "세션 ID", example = "1")
        Long id,
        @Schema(description = "세션 제목", example = "백엔드 면접 준비")
        String title,
        @Schema(description = "지원 직무 유형", example = "BACKEND")
        String positionType,
        @Schema(description = "포트폴리오 URL", example = "https://github.com/user/portfolio")
        String portfolioUrl,
        @Schema(description = "세션 상태", example = "COMPLETED")
        ResumeSessionStatus status,
        @Schema(description = "면접 질문 목록")
        List<ResumeQuestionResponse> questions,
        @Schema(description = "전체 질문 수", example = "5")
        int totalQuestionCount,
        @Schema(description = "답변이 제출된 질문 수", example = "3")
        int answeredQuestionCount,
        @Schema(description = "가장 최근 답변 제출 시각", nullable = true)
        LocalDateTime lastAttemptAt,
        @Schema(description = "생성 일시")
        LocalDateTime createdAt,
        @Schema(description = "수정 일시")
        LocalDateTime updatedAt,
        @Schema(description = "완료 일시", nullable = true)
        LocalDateTime completedAt,
        @Schema(description = "AI 회고 리포트 존재 여부")
        boolean hasReport
) implements Serializable {
    public static ResumeSessionResponse from(ResumeSession s) {
        List<ResumeQuestionResponse> questionResponses = new ArrayList<>(
                s.getQuestions().stream().map(ResumeQuestionResponse::from).toList()
        );
        int total = questionResponses.size();
        int answered = (int) questionResponses.stream()
                .filter(q -> q.attempts() != null && !q.attempts().isEmpty())
                .count();
        LocalDateTime lastAttempt = questionResponses.stream()
                .filter(q -> q.attempts() != null)
                .flatMap(q -> q.attempts().stream())
                .map(com.devweb.api.resume.question.dto.ResumeFeedbackResponse::createdAt)
                .filter(java.util.Objects::nonNull)
                .max(LocalDateTime::compareTo)
                .orElse(null);
        return new ResumeSessionResponse(
                s.getId(),
                s.getTitle(),
                s.getPositionType(),
                s.getPortfolioUrl(),
                s.getStatus(),
                questionResponses,
                total,
                answered,
                lastAttempt,
                s.getCreatedAt(),
                s.getUpdatedAt(),
                s.getCompletedAt(),
                s.getReportJson() != null && !s.getReportJson().isBlank()
        );
    }
}
