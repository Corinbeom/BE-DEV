package com.devweb.api.studyquiz.session.dto;

import com.devweb.domain.studyquiz.session.model.CsQuizQuestion;

import java.time.LocalDateTime;
import java.util.List;

public record CsQuizQuestionResponse(
        Long id,
        int orderIndex,
        String topic,
        String difficulty,
        String type,
        String prompt,
        List<String> choices,
        LocalDateTime createdAt
) {
    public static CsQuizQuestionResponse from(CsQuizQuestion q) {
        return new CsQuizQuestionResponse(
                q.getId(),
                q.getOrderIndex(),
                q.getTopic().name(),
                q.getDifficulty().name(),
                q.getType().name(),
                q.getPrompt(),
                q.isMultipleChoice() ? q.getChoices() : List.of(),
                q.getCreatedAt()
        );
    }
}

