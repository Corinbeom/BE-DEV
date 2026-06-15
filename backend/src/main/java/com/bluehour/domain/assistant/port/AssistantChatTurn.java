package com.bluehour.domain.assistant.port;

public record AssistantChatTurn(
        Role role,
        String content
) {
    public enum Role {
        USER,
        ASSISTANT
    }
}
