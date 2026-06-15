package com.bluehour.domain.assistant.port;

import java.util.List;

public interface AssistantAiPort {
    void stream(AssistantContext context, String message, List<AssistantChatTurn> history, TokenSink sink);

    interface TokenSink {
        void token(String token);
    }
}
