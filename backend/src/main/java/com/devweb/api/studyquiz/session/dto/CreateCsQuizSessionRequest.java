package com.devweb.api.studyquiz.session.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateCsQuizSessionRequest(
        @NotBlank String difficulty,
        @Size(min = 1) List<String> topics,
        @Min(5) @Max(10) int questionCount,
        String title
) {
}
