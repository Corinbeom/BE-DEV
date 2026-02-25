package com.devweb.api.studyquiz.question.dto;

import com.devweb.domain.studyquiz.session.model.CsQuizAttempt;
import com.devweb.domain.studyquiz.session.model.CsQuizFeedback;

import java.time.LocalDateTime;
import java.util.List;

public record CsQuizAttemptResponse(
        Long attemptId,
        LocalDateTime createdAt,
        Boolean correct,
        List<String> strengths,
        List<String> improvements,
        String suggestedAnswer,
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

