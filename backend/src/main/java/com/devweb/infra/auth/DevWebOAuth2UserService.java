package com.devweb.infra.auth;

import com.devweb.domain.member.model.Member;
import com.devweb.domain.member.port.MemberRepository;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class DevWebOAuth2UserService extends DefaultOAuth2UserService {

    private final MemberRepository memberRepository;

    public DevWebOAuth2UserService(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        Map<String, Object> attributes = oAuth2User.getAttributes();

        String oauthSubject;
        String email;
        String displayName;
        String photoUrl;

        if ("google".equals(registrationId)) {
            oauthSubject = (String) attributes.get("sub");
            email = (String) attributes.get("email");
            displayName = (String) attributes.get("name");
            photoUrl = (String) attributes.get("picture");
        } else if ("kakao".equals(registrationId)) {
            oauthSubject = String.valueOf(attributes.get("id"));
            Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
            email = kakaoAccount != null ? (String) kakaoAccount.get("email") : null;
            Map<String, Object> profile = kakaoAccount != null
                    ? (Map<String, Object>) kakaoAccount.get("profile") : null;
            displayName = profile != null ? (String) profile.get("nickname") : null;
            photoUrl = null;
        } else {
            throw new OAuth2AuthenticationException("지원하지 않는 OAuth2 공급자: " + registrationId);
        }

        if (email == null) {
            email = registrationId + "_" + oauthSubject + "@devweb.local";
        }

        final String finalEmail = email;
        final String finalOauthSubject = oauthSubject;
        final String finalDisplayName = displayName;
        final String finalPhotoUrl = photoUrl;

        memberRepository.findByOauthProviderAndOauthSubject(registrationId, oauthSubject)
                .orElseGet(() -> {
                    Member newMember = new Member(
                            finalEmail,
                            registrationId,
                            finalOauthSubject,
                            finalDisplayName,
                            finalPhotoUrl
                    );
                    return memberRepository.save(newMember);
                });

        return oAuth2User;
    }
}
