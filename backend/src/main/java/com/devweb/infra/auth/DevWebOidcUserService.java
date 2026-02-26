package com.devweb.infra.auth;

import com.devweb.domain.member.model.Member;
import com.devweb.domain.member.port.MemberRepository;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

@Service
public class DevWebOidcUserService extends OidcUserService {

    private final MemberRepository memberRepository;

    public DevWebOidcUserService(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }

    @Override
    public OidcUser loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
        OidcUser oidcUser = super.loadUser(userRequest);

        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        String oauthSubject = oidcUser.getSubject();
        String email = oidcUser.getEmail();
        String displayName = oidcUser.getFullName();
        String photoUrl = oidcUser.getPicture();

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

        return oidcUser;
    }
}
