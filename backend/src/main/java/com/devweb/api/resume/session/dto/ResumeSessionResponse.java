package com.devweb.api.resume.session.dto;

import com.devweb.domain.resume.session.model.ResumeSession;
import com.devweb.domain.resume.session.model.ResumeSessionStatus;

import java.time.LocalDateTime;
import java.util.List;

public record ResumeSessionResponse(
        Long id,
        String title,
        String positionType,
        String portfolioUrl,
        ResumeSessionStatus status,
        List<ResumeQuestionResponse> questions,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static ResumeSessionResponse from(ResumeSession s) {
        return new ResumeSessionResponse(
                s.getId(),
                s.getTitle(),
                s.getPositionType() == null ? null : s.getPositionType().name(),
                s.getPortfolioUrl(),
                s.getStatus(),
                s.getQuestions().stream().map(ResumeQuestionResponse::from).toList(),
                s.getCreatedAt(),
                s.getUpdatedAt()
        );
    }
}

