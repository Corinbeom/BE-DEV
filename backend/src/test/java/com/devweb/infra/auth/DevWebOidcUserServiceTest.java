package com.devweb.infra.auth;

import com.devweb.domain.member.model.Member;
import com.devweb.domain.member.port.MemberRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DevWebOidcUserServiceTest {

    @Mock
    MemberRepository memberRepository;

    DevWebOidcUserService sut;

    @BeforeEach
    void setUp() {
        sut = spy(new DevWebOidcUserService(memberRepository));
    }

    @Test
    @DisplayName("OIDC 신규 회원 → Member 저장 + OidcUser 반환")
    void oidc_신규회원_저장() {
        // given
        OidcUserRequest request = createOidcUserRequest("google");
        OidcUser fakeUser = createOidcUser("oidc-sub-1", "user@gmail.com", "Test User", "https://photo.url");
        doReturn(fakeUser).when(sut).callParentLoadUser(request);

        given(memberRepository.findByOauthProviderAndOauthSubject("google", "oidc-sub-1"))
                .willReturn(Optional.empty());
        given(memberRepository.save(any(Member.class))).willAnswer(inv -> inv.getArgument(0));

        // when
        OidcUser result = sut.loadUser(request);

        // then
        assertThat(result).isSameAs(fakeUser);
        verify(memberRepository).save(any(Member.class));
    }

    @Test
    @DisplayName("OIDC 기존 회원 → save 미호출")
    void oidc_기존회원_save_미호출() {
        // given
        OidcUserRequest request = createOidcUserRequest("google");
        OidcUser fakeUser = createOidcUser("oidc-sub-1", "user@gmail.com", "Test User", "https://photo.url");
        doReturn(fakeUser).when(sut).callParentLoadUser(request);

        Member existingMember = new Member("user@gmail.com", "google", "oidc-sub-1", "Test User", "https://photo.url");
        given(memberRepository.findByOauthProviderAndOauthSubject("google", "oidc-sub-1"))
                .willReturn(Optional.of(existingMember));

        // when
        OidcUser result = sut.loadUser(request);

        // then
        assertThat(result).isSameAs(fakeUser);
        verify(memberRepository, never()).save(any());
    }

    @Test
    @DisplayName("email null → fallback 이메일 생성")
    void email_null_fallback() {
        // given
        OidcUserRequest request = createOidcUserRequest("google");
        OidcUser fakeUser = createOidcUser("no-email-sub", null, "No Email", null);
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

    private OidcUserRequest createOidcUserRequest(String registrationId) {
        ClientRegistration registration = ClientRegistration.withRegistrationId(registrationId)
                .clientId("test-client-id")
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri("https://localhost/callback")
                .authorizationUri("https://auth.example.com/authorize")
                .tokenUri("https://auth.example.com/token")
                .jwkSetUri("https://auth.example.com/jwks")
                .build();
        OAuth2AccessToken accessToken = new OAuth2AccessToken(
                OAuth2AccessToken.TokenType.BEARER, "test-token",
                Instant.now(), Instant.now().plusSeconds(3600));
        OidcIdToken idToken = new OidcIdToken(
                "id-token-value", Instant.now(), Instant.now().plusSeconds(3600),
                Map.of("sub", "oidc-sub-1", "iss", "https://accounts.google.com"));
        return new OidcUserRequest(registration, accessToken, idToken);
    }

    private OidcUser createOidcUser(String subject, String email, String name, String picture) {
        Map<String, Object> claims = new java.util.HashMap<>();
        claims.put("sub", subject);
        claims.put("iss", "https://accounts.google.com");
        if (email != null) {
            claims.put("email", email);
        }
        if (name != null) {
            claims.put("name", name);
        }
        if (picture != null) {
            claims.put("picture", picture);
        }
        OidcIdToken idToken = new OidcIdToken(
                "id-token-value", Instant.now(), Instant.now().plusSeconds(3600), claims);
        return new DefaultOidcUser(java.util.Collections.singleton(() -> "ROLE_USER"), idToken);
    }
}
