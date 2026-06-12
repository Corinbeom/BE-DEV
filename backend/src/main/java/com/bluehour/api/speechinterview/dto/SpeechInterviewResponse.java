package com.bluehour.api.speechinterview.dto;

import com.bluehour.domain.speechinterview.model.*;

import java.time.LocalDateTime;
import java.util.List;

public record SpeechInterviewResponse(
        Long id,
        String title,
        String positionType,
        String status,
        LocalDateTime createdAt,
        LocalDateTime completedAt,
        List<QuestionDto> questions
) {
    public record QuestionDto(
            Long id,
            int orderIndex,
            String badge,
            String questionText,
            AnswerDto answer
    ) {
    }

    public record AnswerDto(
            String answerText,
            String feedbackStatus,
            FeedbackDto feedback
    ) {
    }

    public record FeedbackDto(
            List<String> strengths,
            List<String> improvements,
            String suggestedAnswer,
            List<String> followups,
            List<String> deliveryStrengths,
            List<String> deliveryImprovements
    ) {
    }

    public static SpeechInterviewResponse from(SpeechInterviewSession session) {
        List<QuestionDto> questions = session.getQuestions().stream()
                .map(SpeechInterviewResponse::toQuestionDto)
                .toList();

        return new SpeechInterviewResponse(
                session.getId(),
                session.getTitle(),
                session.getPositionType(),
                session.getStatus().name(),
                session.getCreatedAt(),
                session.getCompletedAt(),
                questions
        );
    }

    private static QuestionDto toQuestionDto(SpeechInterviewQuestion q) {
        SpeechInterviewAnswer answer = q.getAnswer();
        AnswerDto answerDto = null;
        if (answer != null) {
            FeedbackDto feedbackDto = null;
            SpeechAnswerFeedback fb = answer.getFeedback();
            if (fb != null) {
                feedbackDto = new FeedbackDto(
                        fb.getStrengths(),
                        fb.getImprovements(),
                        fb.getSuggestedAnswer(),
                        fb.getFollowups(),
                        fb.getDeliveryStrengths(),
                        fb.getDeliveryImprovements()
                );
            }
            answerDto = new AnswerDto(
                    answer.getAnswerText(),
                    answer.getFeedbackStatus().name(),
                    feedbackDto
            );
        }
        return new QuestionDto(q.getId(), q.getOrderIndex(), q.getBadge(), q.getQuestionText(), answerDto);
    }
}
