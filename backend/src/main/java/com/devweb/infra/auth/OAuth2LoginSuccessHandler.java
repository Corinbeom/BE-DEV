package com.devweb.infra.auth;

import com.devweb.domain.member.model.Member;
import com.devweb.domain.member.port.MemberRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;

@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final MemberRepository memberRepository;
    private final String frontendUrl;

    public OAuth2LoginSuccessHandler(
            JwtTokenProvider jwtTokenProvider,
            MemberRepository memberRepository,
            @Value("${devweb.frontend-url}") String frontendUrl
    ) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.memberRepository = memberRepository;
        this.frontendUrl = frontendUrl;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        OAuth2User oAuth2User = oauthToken.getPrincipal();
        String registrationId = oauthToken.getAuthorizedClientRegistrationId();
        Map<String, Object> attributes = oAuth2User.getAttributes();

        String oauthSubject;
        if ("google".equals(registrationId)) {
            oauthSubject = (String) attributes.get("sub");
        } else {
            oauthSubject = String.valueOf(attributes.get("id"));
        }

        Member member = memberRepository
                .findByOauthProviderAndOauthSubject(registrationId, oauthSubject)
                .orElseThrow(() -> new IllegalStateException("Member not found after OAuth2 login"));

        String token = jwtTokenProvider.generateToken(member.getId());

        Cookie cookie = new Cookie("devweb_token", token);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(86400);
        // production에서는 Secure 플래그 활성화 필요
        // cookie.setSecure(true);
        response.addCookie(cookie);

        response.sendRedirect(frontendUrl + "/auth/callback");
    }
}
