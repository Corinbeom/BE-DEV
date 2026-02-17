package com.devweb.domain.member.port;

import com.devweb.domain.member.model.Member;

import java.util.Optional;

/**
 * Repository Port (DIP)
 */
public interface MemberRepository {
    Member save(Member member);

    Optional<Member> findById(Long id);
}


