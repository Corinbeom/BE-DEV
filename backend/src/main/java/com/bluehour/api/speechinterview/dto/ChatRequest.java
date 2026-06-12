package com.bluehour.api.speechinterview.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ChatRequest(
        @NotNull @Size(max = 2000) String userMessage
) {
}
