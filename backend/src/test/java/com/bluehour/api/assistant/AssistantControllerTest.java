package com.bluehour.api.assistant;

import com.bluehour.api.assistant.dto.AssistantChatRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.assertj.core.api.Assertions.assertThat;

@WebMvcTest(AssistantController.class)
@AutoConfigureMockMvc(addFilters = false)
@TestPropertySource(properties = "bluehour.frontend-url=http://localhost:3000")
class AssistantControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockBean
    AssistantService assistantService;

    @BeforeEach
    void setUpAuth() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(1L, null, List.of())
        );
    }

    @Test
    @DisplayName("POST /api/assistant/chat → SSE async stream")
    void chat_성공() throws Exception {
        SseEmitter emitter = new SseEmitter(1L);
        given(assistantService.chat(eq(1L), any(AssistantChatRequest.class))).willReturn(emitter);

        mockMvc.perform(post("/api/assistant/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(MediaType.TEXT_EVENT_STREAM)
                        .content("""
                                {
                                  "message": "이번 주 뭘 집중해야 할까?",
                                  "history": [
                                    {"role": "assistant", "content": "첫 진단"}
                                  ]
                                }
                """))
                .andExpect(status().isOk())
                .andExpect(request().asyncStarted());

        then(assistantService).should().chat(eq(1L), any(AssistantChatRequest.class));
    }

    @Test
    @DisplayName("chat endpoint는 text/event-stream을 produce한다")
    void chat_produces_sse() throws Exception {
        PostMapping mapping = AssistantController.class
                .getMethod("chat", AssistantChatRequest.class)
                .getAnnotation(PostMapping.class);

        assertThat(mapping.produces()).contains(MediaType.TEXT_EVENT_STREAM_VALUE);
    }

    @Test
    @DisplayName("빈 message는 400 Bad Request")
    void chat_빈_message_실패() throws Exception {
        mockMvc.perform(post("/api/assistant/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "message": "",
                                  "history": []
                                }
                                """))
                .andExpect(status().isBadRequest());
    }
}
