package com.devweb.infra.auth;

import com.devweb.domain.member.model.Member;
import com.devweb.domain.member.port.MemberRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.time.Instant;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DevWebOAuth2UserServiceTest {

    @Mock
    MemberRepository memberRepository;

    DevWebOAuth2UserService sut;

    @BeforeEach
    void setUp() {
        sut = spy(new DevWebOAuth2UserService(memberRepository));
    }

    @Test
    @DisplayName("Google 신규 회원 → Member 저장 + OAuth2User 반환")
    void google_신규회원_저장() {
        // given
        OAuth2UserRequest request = createUserRequest("google");
        Map<String, Object> attrs = Map.of(
                "sub", "google-sub-123",
                "email", "user@gmail.com",
                "name", "Test User",
                "picture", "https://photo.url"
        );
        OAuth2User fakeUser = new DefaultOAuth2User(
                Collections.singleton(() -> "ROLE_USER"), attrs, "sub");
        doReturn(fakeUser).when(sut).callParentLoadUser(request);

        given(memberRepository.findByOauthProviderAndOauthSubject("google", "google-sub-123"))
                .willReturn(Optional.empty());
        given(memberRepository.save(any(Member.class))).willAnswer(inv -> inv.getArgument(0));

        // when
        OAuth2User result = sut.loadUser(request);

        // then
        assertThat(result).isSameAs(fakeUser);
        verify(memberRepository).save(any(Member.class));
    }

    @Test
    @DisplayName("Google 기존 회원 → save 미호출")
    void google_기존회원_save_미호출() {
        // given
        OAuth2UserRequest request = createUserRequest("google");
        Map<String, Object> attrs = Map.of(
                "sub", "google-sub-123",
                "email", "user@gmail.com",
                "name", "Test User",
                "picture", "https://photo.url"
        );
        OAuth2User fakeUser = new DefaultOAuth2User(
                Collections.singleton(() -> "ROLE_USER"), attrs, "sub");
        doReturn(fakeUser).when(sut).callParentLoadUser(request);

        Member existingMember = new Member("user@gmail.com", "google", "google-sub-123", "Test User", "https://photo.url");
        given(memberRepository.findByOauthProviderAndOauthSubject("google", "google-sub-123"))
                .willReturn(Optional.of(existingMember));

        // when
        OAuth2User result = sut.loadUser(request);

        // then
        assertThat(result).isSameAs(fakeUser);
        verify(memberRepository, never()).save(any());
    }

    @Test
    @DisplayName("Kakao 로그인 → 중첩 맵에서 email/nickname 추출 + 회원 저장")
    void kakao_중첩맵_추출_저장() {
        // given
        OAuth2UserRequest request = createUserRequest("kakao");
        Map<String, Object> profile = Map.of("nickname", "카카오유저");
        Map<String, Object> kakaoAccount = Map.of(
                "email", "kakao@test.com",
                "profile", profile
        );
        Map<String, Object> attrs = new HashMap<>();
        attrs.put("id", 12345L);
        attrs.put("kakao_account", kakaoAccount);

        OAuth2User fakeUser = new DefaultOAuth2User(
                Collections.singleton(() -> "ROLE_USER"), attrs, "id");
        doReturn(fakeUser).when(sut).callParentLoadUser(request);

        given(memberRepository.findByOauthProviderAndOauthSubject("kakao", "12345"))
                .willReturn(Optional.empty());
        given(memberRepository.save(any(Member.class))).willAnswer(inv -> inv.getArgument(0));

        // when
        OAuth2User result = sut.loadUser(request);

        // then
        assertThat(result).isSameAs(fakeUser);
        verify(memberRepository).save(any(Member.class));
    }

    @Test
    @DisplayName("email null → fallback 이메일 생성")
    void email_null_fallback() {
        // given
        OAuth2UserRequest request = createUserRequest("google");
        Map<String, Object> attrs = new HashMap<>();
        attrs.put("sub", "no-email-sub");
        attrs.put("email", null);
        attrs.put("name", "No Email User");
        attrs.put("picture", null);

        OAuth2User fakeUser = new DefaultOAuth2User(
                Collections.singleton(() -> "ROLE_USER"), attrs, "sub");
        doReturn(fakeUser).when(sut).callParentLoadUser(request);

        given(memberRepository.findByOauthProviderAndOauthSubject("google", "no-email-sub"))
                .willReturn(Optional.empty());
        given(memberRepository.save(any(Member.class))).willAnswer(inv -> inv.getArgument(0));

        // when
        sut.loadUser(request);

        // then
        verify(memberRepository).save(argThat(member ->
                member.getEmail().equals("google_no-email-sub@devweb.local")
        ));
    }

    @Test
    @DisplayName("지원하지 않는 provider → OAuth2AuthenticationException")
    void 미지원_provider_예외() {
        // given
        OAuth2UserRequest request = createUserRequest("github");
        Map<String, Object> attrs = Map.of("id", "gh-123");
        OAuth2User fakeUser = new DefaultOAuth2User(
                Collections.singleton(() -> "ROLE_USER"), attrs, "id");
        doReturn(fakeUser).when(sut).callParentLoadUser(request);

        // when & then
        assertThatThrownBy(() -> sut.loadUser(request))
                .isInstanceOf(OAuth2AuthenticationException.class);
    }

    private OAuth2UserRequest createUserRequest(String registrationId) {
        ClientRegistration registration = ClientRegistration.withRegistrationId(registrationId)
                .clientId("test-client-id")
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri("https://localhost/callback")
                .authorizationUri("https://auth.example.com/authorize")
                .tokenUri("https://auth.example.com/token")
                .build();
        OAuth2AccessToken accessToken = new OAuth2AccessToken(
                OAuth2AccessToken.TokenType.BEARER, "test-token",
                Instant.now(), Instant.now().plusSeconds(3600));
        return new OAuth2UserRequest(registration, accessToken);
    }
}
