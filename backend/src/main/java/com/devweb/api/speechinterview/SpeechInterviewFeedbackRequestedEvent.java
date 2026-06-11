package com.devweb.api.speechinterview;

public record SpeechInterviewFeedbackRequestedEvent(
        Long sessionId,
        Long questionId,
        String answerText,
        String questionText,
        String intention,
        String keywords,
        String modelAnswer,
        String positionType
) {
}
