package com.devweb.api.resume.question.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateResumeFeedbackRequest(
        @NotBlank String answerText
) {
}

