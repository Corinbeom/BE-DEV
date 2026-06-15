package com.bluehour.api.assistant;

import com.bluehour.api.assistant.dto.AssistantChatRequest;
import com.bluehour.common.AuthUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Tag(name = "AI 비서", description = "취업준비 AI 비서 채팅 API")
@RestController
@RequestMapping("/api/assistant")
public class AssistantController {

    private final AssistantService assistantService;

    public AssistantController(AssistantService assistantService) {
        this.assistantService = assistantService;
    }

    @Operation(summary = "AI 비서 채팅", description = "사용자의 취업 준비 데이터 컨텍스트를 포함해 SSE로 답변을 스트리밍합니다.")
    @PostMapping(value = "/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter chat(@Valid @RequestBody AssistantChatRequest request) {
        return assistantService.chat(AuthUtils.currentMemberId(), request);
    }
}
