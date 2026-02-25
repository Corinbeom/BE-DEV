package com.devweb.api.studyquiz.question.dto;

public record CreateCsQuizAttemptRequest(
        Integer selectedChoiceIndex,
        String answerText
) {
}

