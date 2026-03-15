package com.devweb.api.resume.session;

import com.devweb.domain.member.model.Member;
import com.devweb.domain.resume.session.model.PositionType;
import com.devweb.domain.resume.session.model.ResumeSession;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ResumeSessionController.class)
@AutoConfigureMockMvc(addFilters = false)
@TestPropertySource(properties = "devweb.frontend-url=http://localhost:3000")
class ResumeSessionControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockBean
    ResumeSessionService service;

    ResumeSession session;

    @BeforeEach
    void setUp() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(1L, null, List.of())
        );

        Member member = new Member("user@example.com");
        setId(member, 1L);

        session = new ResumeSession(member, PositionType.BE, "테스트 세션", null);
        setId(session, 20L);
        setField(session, "createdAt", LocalDateTime.now());
        setField(session, "updatedAt", LocalDateTime.now());
    }

    @Test
    @DisplayName("GET /api/resume-sessions → 200")
    void listByCurrentMember_성공() throws Exception {
        given(service.listByMember(1L)).willReturn(List.of(session));

        mockMvc.perform(get("/api/resume-sessions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].title").value("테스트 세션"));
    }

    @Test
    @DisplayName("POST /api/resume-sessions JSON body → 200")
    void create_성공() throws Exception {
        given(service.createFromResume(eq(1L), eq("BACKEND"), eq("세션 제목"),
                eq(5L), isNull(), isNull()))
                .willReturn(session);

        mockMvc.perform(post("/api/resume-sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "positionType": "BACKEND",
                                  "resumeId": 5,
                                  "title": "세션 제목"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(20));
    }

    @Test
    @DisplayName("GET /api/resume-sessions/{id} → 200")
    void get_성공() throws Exception {
        given(service.get(20L)).willReturn(session);

        mockMvc.perform(get("/api/resume-sessions/20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(20))
                .andExpect(jsonPath("$.data.title").value("테스트 세션"));
    }

    private void setId(Object entity, Long id) throws Exception {
        Field field = entity.getClass().getDeclaredField("id");
        field.setAccessible(true);
        field.set(entity, id);
    }

    private void setField(Object entity, String fieldName, Object value) throws Exception {
        Field field = entity.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(entity, value);
    }
}
