package com.devweb.infra.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    JwtTokenProvider jwtTokenProvider;

    @Mock
    FilterChain filterChain;

    JwtAuthenticationFilter sut;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        sut = new JwtAuthenticationFilter(jwtTokenProvider);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("유효한 devweb_token 쿠키 → SecurityContext에 인증 설정")
    void 유효한_토큰_쿠키() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new Cookie("devweb_token", "valid-token"));
        MockHttpServletResponse response = new MockHttpServletResponse();

        given(jwtTokenProvider.isValid("valid-token")).willReturn(true);
        given(jwtTokenProvider.getMemberId("valid-token")).willReturn(99L);

        sut.doFilterInternal(request, response, filterChain);

        var auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNotNull();
        assertThat(auth.getPrincipal()).isEqualTo(99L);
        assertThat(auth.isAuthenticated()).isTrue();
    }

    @Test
    @DisplayName("쿠키 없음 → SecurityContext 비어있음")
    void 쿠키_없음() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        sut.doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    @DisplayName("무효한 토큰 쿠키 → SecurityContext 비어있음")
    void 무효한_토큰_쿠키() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new Cookie("devweb_token", "invalid-token"));
        MockHttpServletResponse response = new MockHttpServletResponse();

        given(jwtTokenProvider.isValid("invalid-token")).willReturn(false);

        sut.doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }
}
