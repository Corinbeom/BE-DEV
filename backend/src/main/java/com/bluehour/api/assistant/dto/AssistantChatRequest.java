package com.bluehour.api.assistant.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record AssistantChatRequest(
        @NotBlank(message = "message는 필수입니다.")
        @Size(max = 2000, message = "message는 2000자 이하여야 합니다.")
        String message,

        @Valid
        List<ChatTurn> history
) {
}
