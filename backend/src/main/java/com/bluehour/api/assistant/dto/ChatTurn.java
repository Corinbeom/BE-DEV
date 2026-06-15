package com.bluehour.api.assistant.dto;

public record ChatTurn(
        String role,
        String content
) {
}
