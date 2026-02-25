package com.devweb.api.studyquiz.session.dto;

import com.devweb.domain.studyquiz.session.model.CsQuizSession;
import com.devweb.domain.studyquiz.session.model.CsQuizSessionStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

public record CsQuizSessionResponse(
        Long id,
        String title,
        String difficulty,
        Set<String> topics,
        CsQuizSessionStatus status,
        List<CsQuizQuestionResponse> questions,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static CsQuizSessionResponse from(CsQuizSession s) {
        return new CsQuizSessionResponse(
                s.getId(),
                s.getTitle(),
                s.getDifficulty().name(),
                s.getTopics().stream().map(Enum::name).collect(java.util.stream.Collectors.toCollection(java.util.LinkedHashSet::new)),
                s.getStatus(),
                s.getQuestions().stream().map(CsQuizQuestionResponse::from).toList(),
                s.getCreatedAt(),
                s.getUpdatedAt()
        );
    }
}

