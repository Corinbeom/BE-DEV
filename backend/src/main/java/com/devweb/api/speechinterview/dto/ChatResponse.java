package com.devweb.api.speechinterview.dto;

public record ChatResponse(
        String aiMessage,
        int turnIndex,
        boolean isComplete,
        Long questionId,
        String badge
) {
}
