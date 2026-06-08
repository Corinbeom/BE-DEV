package com.devweb.api.speechinterview.dto;

import jakarta.validation.constraints.NotNull;

public record CreateSpeechInterviewRequest(
        @NotNull Long resumeSessionId
) {
}
