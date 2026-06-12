package com.bluehour.infra.persistence.member;

import com.bluehour.domain.member.model.Member;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SpringDataMemberJpaRepository extends JpaRepository<Member, Long> {
    Optional<Member> findByEmail(String email);

    Optional<Member> findByOauthProviderAndOauthSubject(String oauthProvider, String oauthSubject);
}
