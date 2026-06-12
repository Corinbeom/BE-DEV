package com.bluehour.domain.member.port;

import com.bluehour.domain.member.model.Member;

import java.util.Optional;

/**
 * Repository Port (DIP)
 */
public interface MemberRepository {
    Member save(Member member);

    Optional<Member> findById(Long id);

    Optional<Member> findByEmail(String email);

    Optional<Member> findByOauthProviderAndOauthSubject(String provider, String subject);

    void delete(Member member);
}
