package com.devweb.api.studyquiz.session.dto;

import com.devweb.domain.studyquiz.session.model.CsQuizQuestion;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.ArrayList;
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
) implements Serializable {
    public static CsQuizQuestionResponse from(CsQuizQuestion q) {
        return new CsQuizQuestionResponse(
                q.getId(),
                q.getOrderIndex(),
                q.getTopic().name(),
                q.getDifficulty().name(),
                q.getType().name(),
                q.getPrompt(),
                q.isMultipleChoice() ? new ArrayList<>(q.getChoices()) : new ArrayList<>(),
                q.getCreatedAt()
        );
    }
}

