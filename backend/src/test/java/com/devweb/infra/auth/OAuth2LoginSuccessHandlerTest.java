package com.devweb.infra.auth;

import com.devweb.domain.member.model.Member;
import com.devweb.domain.member.port.MemberRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class OAuth2LoginSuccessHandlerTest {

    @Mock
    JwtTokenProvider jwtTokenProvider;

    @Mock
    MemberRepository memberRepository;

    OAuth2LoginSuccessHandler sut;

    static final String FRONTEND_URL = "https://devweb.example.com";

    @BeforeEach
    void setUp() {
        sut = new OAuth2LoginSuccessHandler(jwtTokenProvider, memberRepository, FRONTEND_URL);
    }

    @Test
    @DisplayName("Google 로그인 성공 → Set-Cookie에 JWT + redirect to /auth/callback")
    void google_로그인_성공() throws Exception {
        // given
        OAuth2User oAuth2User = new DefaultOAuth2User(
                Collections.singleton(() -> "ROLE_USER"),
                Map.of("sub", "google-sub-1", "email", "user@gmail.com"),
                "sub");
        OAuth2AuthenticationToken auth = new OAuth2AuthenticationToken(
                oAuth2User, oAuth2User.getAuthorities(), "google");

        Member member = new Member("user@gmail.com", "google", "google-sub-1", "Test User", null);
        ReflectionTestUtils.setField(member, "id", 42L);

        given(memberRepository.findByOauthProviderAndOauthSubject("google", "google-sub-1"))
                .willReturn(Optional.of(member));
        given(jwtTokenProvider.generateToken(42L)).willReturn("jwt-token-value");

        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        // when
        sut.onAuthenticationSuccess(request, response, auth);

        // then
        assertThat(response.getHeader("Set-Cookie")).contains("devweb_token=jwt-token-value");
        assertThat(response.getRedirectedUrl()).isEqualTo(FRONTEND_URL + "/auth/callback");
    }

    @Test
    @DisplayName("Kakao 로그인 성공 → attributes.get('id')로 oauthSubject 추출")
    void kakao_로그인_성공() throws Exception {
        // given
        OAuth2User oAuth2User = new DefaultOAuth2User(
                Collections.singleton(() -> "ROLE_USER"),
                Map.of("id", 98765L, "connected_at", "2024-01-01"),
                "id");
        OAuth2AuthenticationToken auth = new OAuth2AuthenticationToken(
                oAuth2User, oAuth2User.getAuthorities(), "kakao");

        Member member = new Member("kakao@test.com", "kakao", "98765", "카카오유저", null);
        ReflectionTestUtils.setField(member, "id", 7L);

        given(memberRepository.findByOauthProviderAndOauthSubject("kakao", "98765"))
                .willReturn(Optional.of(member));
        given(jwtTokenProvider.generateToken(7L)).willReturn("kakao-jwt-token");

        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        // when
        sut.onAuthenticationSuccess(request, response, auth);

        // then
        assertThat(response.getHeader("Set-Cookie")).contains("devweb_token=kakao-jwt-token");
        assertThat(response.getRedirectedUrl()).isEqualTo(FRONTEND_URL + "/auth/callback");
    }

    @Test
    @DisplayName("회원 조회 실패 → IllegalStateException")
    void 회원_조회_실패() {
        // given
        OAuth2User oAuth2User = new DefaultOAuth2User(
                Collections.singleton(() -> "ROLE_USER"),
                Map.of("sub", "unknown-sub"),
                "sub");
        OAuth2AuthenticationToken auth = new OAuth2AuthenticationToken(
                oAuth2User, oAuth2User.getAuthorities(), "google");

        given(memberRepository.findByOauthProviderAndOauthSubject("google", "unknown-sub"))
                .willReturn(Optional.empty());

        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        // when & then
        assertThatThrownBy(() -> sut.onAuthenticationSuccess(request, response, auth))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Member not found");
    }

    @Test
    @DisplayName("쿠키 속성 검증: HttpOnly, Secure, SameSite=None, Max-Age=86400")
    void 쿠키_속성_검증() throws Exception {
        // given
        OAuth2User oAuth2User = new DefaultOAuth2User(
                Collections.singleton(() -> "ROLE_USER"),
                Map.of("sub", "google-sub-2"),
                "sub");
        OAuth2AuthenticationToken auth = new OAuth2AuthenticationToken(
                oAuth2User, oAuth2User.getAuthorities(), "google");

        Member member = new Member("test@test.com", "google", "google-sub-2", "Test", null);
        ReflectionTestUtils.setField(member, "id", 1L);

        given(memberRepository.findByOauthProviderAndOauthSubject("google", "google-sub-2"))
                .willReturn(Optional.of(member));
        given(jwtTokenProvider.generateToken(1L)).willReturn("some-token");

        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        // when
        sut.onAuthenticationSuccess(request, response, auth);

        // then
        String cookie = response.getHeader("Set-Cookie");
        assertThat(cookie)
                .contains("HttpOnly")
                .contains("Secure")
                .contains("SameSite=None")
                .contains("Max-Age=86400")
                .contains("Path=/");
    }
}
