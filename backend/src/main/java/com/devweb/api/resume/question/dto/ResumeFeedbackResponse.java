package com.devweb.api.resume.question.dto;

import com.devweb.domain.resume.session.model.Feedback;
import com.devweb.domain.resume.session.model.ResumeAnswerAttempt;

import java.time.LocalDateTime;
import java.util.List;

public record ResumeFeedbackResponse(
        Long attemptId,
        LocalDateTime createdAt,
        List<String> strengths,
        List<String> improvements,
        String suggestedAnswer,
        List<String> followups
) {
    public static ResumeFeedbackResponse from(ResumeAnswerAttempt attempt) {
        Feedback f = attempt.getFeedback();
        return new ResumeFeedbackResponse(
                attempt.getId(),
                attempt.getCreatedAt(),
                f == null ? List.of() : f.getStrengths(),
                f == null ? List.of() : f.getImprovements(),
                f == null ? null : f.getSuggestedAnswer(),
                f == null ? List.of() : f.getFollowups()
        );
    }
}

