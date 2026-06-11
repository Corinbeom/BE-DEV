package com.devweb.api.member;

import com.devweb.domain.member.model.Member;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.BeforeEach;
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

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(MemberController.class)
@AutoConfigureMockMvc(addFilters = false)
@TestPropertySource(properties = "devweb.frontend-url=http://localhost:3000")
class MemberControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockBean
    MemberService memberService;

    @BeforeEach
    void setUpAuth() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(1L, null, java.util.List.of())
        );
    }

    @Test
    @DisplayName("POST /api/members 정상 → 200 + MemberResponse")
    void create_성공() throws Exception {
        Member member = new Member("user@example.com");
        setId(member, 1L);
        given(memberService.create(eq("user@example.com"))).willReturn(member);

        mockMvc.perform(post("/api/members")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "user@example.com"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("user@example.com"))
                .andExpect(jsonPath("$.data.onboardingCompleted").value(false))
                .andExpect(jsonPath("$.data.targetRoles").isArray());
    }

    @Test
    @DisplayName("POST /api/members 유효성 실패 (빈 이메일) → 400")
    void create_유효성_실패() throws Exception {
        mockMvc.perform(post("/api/members")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": ""}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
    }

    @Test
    @DisplayName("GET /api/members/{id} 정상 → 200")
    void get_성공() throws Exception {
        Member member = new Member("user@example.com");
        setId(member, 1L);
        given(memberService.get(1L)).willReturn(member);

        mockMvc.perform(get("/api/members/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    @DisplayName("PATCH /api/members/me/target-roles 정상 → 200 + 온보딩 완료")
    void updateMyTargetRoles_성공() throws Exception {
        Member member = new Member("user@example.com");
        setId(member, 1L);
        member.completeOnboarding(java.util.List.of("백엔드 개발자", "프로덕트 매니저"));
        given(memberService.updateTargetRoles(eq(1L), eq(java.util.List.of("백엔드 개발자", "프로덕트 매니저"))))
                .willReturn(member);

        mockMvc.perform(patch("/api/members/me/target-roles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"targetRoles": ["백엔드 개발자", "프로덕트 매니저"]}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.onboardingCompleted").value(true))
                .andExpect(jsonPath("$.data.targetRoles[0]").value("백엔드 개발자"))
                .andExpect(jsonPath("$.data.targetRoles[1]").value("프로덕트 매니저"));
    }

    private void setId(Object entity, Long id) throws Exception {
        Field field = entity.getClass().getDeclaredField("id");
        field.setAccessible(true);
        field.set(entity, id);
    }
}
