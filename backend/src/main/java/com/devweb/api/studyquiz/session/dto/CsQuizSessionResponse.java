package com.devweb.api.studyquiz.session.dto;

import com.devweb.domain.studyquiz.session.model.CsQuizSession;
import com.devweb.domain.studyquiz.session.model.CsQuizSessionStatus;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
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
) implements Serializable {
    public static CsQuizSessionResponse from(CsQuizSession s) {
        return new CsQuizSessionResponse(
                s.getId(),
                s.getTitle(),
                s.getDifficulty().name(),
                new LinkedHashSet<>(s.getTopics().stream().map(Enum::name).toList()),
                s.getStatus(),
                new ArrayList<>(s.getQuestions().stream().map(CsQuizQuestionResponse::from).toList()),
                s.getCreatedAt(),
                s.getUpdatedAt()
        );
    }
}

